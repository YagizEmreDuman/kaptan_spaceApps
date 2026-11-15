"""NASA Smart Farming tasks 11+12: explainable *exploratory* scenario comparison.
Not a crop-yield model, calibrated drought forecast, or validated agronomic advice.
Do not treat seasonal ET guides as irrigation need or compare with monthly rainfall.
"""
from __future__ import annotations
import csv
import math
from functools import lru_cache
from pathlib import Path
from typing import Any
import pandas as pd
from forecast_integration import build_forecasts

DATA = Path(__file__).resolve().parent / 'data'

@lru_cache(maxsize=1)
def crop_catalog():
    with (DATA / 'urun_katalogu.csv').open(encoding='utf-8-sig', newline='') as fh:
        rows = list(csv.DictReader(fh))
    for row in rows:
        for f in ('water_need_min_mm', 'water_need_max_mm'):
            row[f] = float(row[f]) if row[f] else None
    return {r['id']: r for r in rows}

@lru_cache(maxsize=1)
def forecasts():
    return build_forecasts()

@lru_cache(maxsize=1)
def historical():
    return pd.read_csv(DATA / '2025_kasim_tarihsel_stres.csv')

def finite(value, label, low=None, high=None):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f'{label} sayisal ve sonlu olmali')
    x = float(value)
    if low is not None and x < low or high is not None and x > high:
        raise ValueError(f'{label} {low} ile {high} arasinda olmali')
    return x

def optional_number(obj, field, label, low=None, high=None):
    value = obj.get(field)
    return None if value is None else finite(value,label,low,high)

def band(value):
    return 'dusuk' if value < 30 else ('orta' if value < 60 else 'yuksek')

def optional(row, field, nd=3):
    v = row.get(field)
    return None if v is None or pd.isna(v) else round(float(v),nd)


def optional_text(row, field):
    value = row.get(field)
    return None if value is None or pd.isna(value) else str(value)


def monthly_forecasts(frame, lat, lon):
    """Keep each variable's run/grid provenance and missing months explicit."""
    rows = []
    for month, group in frame.groupby('valid_month', sort=True):
        row = nearest(group, lat, lon)
        provenance = {}
        for name, prefix, column in (
            ('temperature', 't2m', 'forecast_temperature_c'),
            ('precipitation', 'rain', 'forecast_precipitation_mm'),
            ('soilMoisture', 'wet3', 'forecast_wet3_index')):
            count = optional(row, prefix + '_member_count', 0)
            provenance[name] = {
                'available': optional(row, column) is not None,
                'forecastRunDate': optional_text(row, prefix + '_init_date'),
                'sourceFile': optional_text(row, prefix + '_files'),
                'sourceVariable': optional_text(row, prefix + '_variable'),
                'sourceUnits': optional_text(row, prefix + '_units'),
                'outputUnits': {'t2m':'degC', 'rain':'mm/month', 'wet3':'1'}[prefix],
                'gridLat': optional(row, prefix + '_grid_lat'),
                'gridLon': optional(row, prefix + '_grid_lon'),
                'ensembleMembers': int(count) if count is not None else None,
                'ensembleMember': optional(row, prefix + '_member', 0),
                'ensembleEvidence': optional_text(row, prefix + '_member_evidence'),
                'ensembleStatus': 'single_member_no_confidence_interval' if count == 1 else 'missing'}
        rows.append({
            'month': month, 'temperatureC': optional(row, 'forecast_temperature_c'),
            'precipitationMm': optional(row, 'forecast_precipitation_mm'),
            'soilWetnessWet3Index': optional(row, 'forecast_wet3_index', 4),
            'historicalBaseline': {
                'referencePeriod': '2006-2025', 'source': 'NASA POWER',
                'temperatureC': optional(row, 'temperature_c_reference_mean'),
                'precipitationMm': optional(row, 'precipitation_mm_reference_mean'),
                'temperatureYearCount': optional(row, 'temperature_reference_year_count', 0),
                'precipitationYearCount': optional(row, 'precipitation_reference_year_count', 0),
                'gridLat': float(row.LAT), 'gridLon': float(row.LON)},
            'temperatureDifferenceCUnadjusted': optional(row, 'temperature_difference_vs_power_c_unadjusted'),
            'precipitationDifferencePctUnadjusted': optional(row, 'precipitation_difference_vs_power_pct_unadjusted'),
            'comparisonStatus': 'uncalibrated_cross_product_comparison',
            'forecastSource': 'NASA GEOS-S2S',
            'forecastRunDate': optional_text(row, 't2m_init_date'),
            'variableForecasts': provenance})
    return rows

def nearest(df, lat, lon):
    distances = (df.LAT - lat)**2 + ((df.LON-lon)*math.cos(math.radians(lat)))**2
    return df.loc[distances.idxmin()]

def options(current, allowed, crops):
    first = current[-2] if len(current) >= 2 else current[0]
    baseline = current[-2:] if len(current) >= 2 else [first, first]
    seqs = [baseline]
    for c in ('chickpea','lentil','sunflower','barley','wheat','maize'):
        candidate = [first,c]
        if c in allowed and c in crops and candidate not in seqs:
            seqs.append(candidate)
        if len(seqs)==3: break
    return seqs

def assess(payload:dict[str,Any]):
    loc = payload.get('location') or {}
    lat = finite(loc.get('latitude',loc.get('lat')),'location.latitude',35,43)
    lon = finite(loc.get('longitude',loc.get('lon')),'location.longitude',25,45)
    user_forecast = payload.get('forecast') or {}
    farmer = payload.get('farmerInputs') or {}
    scenario = payload.get('scenario') or {}
    requested = user_forecast.get('month') or '2026-11'
    fc = forecasts()
    available_months = sorted(fc.valid_month.dropna().unique().tolist())
    if requested not in available_months:
        raise ValueError(f'Tahmin ayi bulunamadi. Mevcut aylar: {available_months}')
    current = farmer.get('currentRotation') or ['wheat','wheat']
    crops = crop_catalog()
    if not isinstance(current,list) or not current or any(c not in crops for c in current):
        raise ValueError('currentRotation urun kodlari listesi olmali')
    allowed = farmer.get('availableCrops') or list(crops)
    if not isinstance(allowed,list) or any(c not in crops for c in allowed):
        raise ValueError('availableCrops katalogdaki urunlerden olusmali')
    max_et = optional_number(farmer,'maxSeasonalCropWaterNeedMm','maxSeasonalCropWaterNeedMm',1,5000)
    irrigated = farmer.get('irrigationAvailable')
    if irrigated is not None and not isinstance(irrigated,bool):
        raise ValueError('irrigationAvailable true/false olmali')
    rain_pct = optional_number(scenario,'rainfallChangePct','rainfallChangePct',-100,300)
    temp_delta = optional_number(scenario,'temperatureChangeC','temperatureChangeC',-10,15)
    irrigation_change = optional_number(scenario,'irrigationAvailabilityChangePct','irrigationAvailabilityChangePct',-100,100)
    rain_pct = rain_pct if rain_pct is not None else 0.
    temp_delta = temp_delta if temp_delta is not None else 0.
    irrigation_change = irrigation_change if irrigation_change is not None else 0.
    frow=nearest(fc[fc.valid_month.eq(requested)],lat,lon)
    monthly = monthly_forecasts(fc, lat, lon)
    selected_month = next(row for row in monthly if row['month'] == requested)
    rain_forecast = optional(frow, 'forecast_precipitation_mm')
    # Historical stress is from November 2025, NOT current/forecast.
    histrow = nearest(historical(),lat,lon) if requested.endswith('-11') else None
    # Simple sensitivity index: the USER's hypothetical changes, NOT a geophysical drought model.
    scenario_pressure = min(100., max(0., 50. + (-rain_pct)*0.35 + temp_delta*3.0 - irrigation_change*0.12))
    results = []
    for idx,seq in enumerate(options(current,allowed,crops)):
        a,b=(crops[x] for x in seq)
        same_family = a['family']==b['family']
        legume_break = a['family']=='cereal' and b['family']=='legume'
        benefit = 'Baklagil rotasyonu, uygun kosullarda azot dongusune katki saglayabilir' if legume_break else ('Bitki ailesi cesitliligi saglar' if not same_family else 'Ayni ailenin tekrari; hastalik/zararli dongusu incelenmeli')
        et_min=b['water_need_min_mm']
        exceeds = max_et is not None and et_min is not None and et_min>max_et
        unknown_water = et_min is None
        # Illustration only: ordinal heuristic. Do not treat as probability or a validated rank.
        suitability = 50 + (12 if legume_break else 5 if not same_family else -7)
        suitability -= scenario_pressure*0.16
        if exceeds: suitability-=18
        if irrigated is False and et_min is not None and et_min>=500: suitability-=7
        if irrigation_change<=-30 and et_min is not None and et_min>=500: suitability-=6
        if unknown_water: suitability-=0  # unknown is not unsuitable
        suitability = int(round(min(100,max(0,suitability))))
        concerns=[]
        if same_family: concerns.append('Ayni bitki ailesinde tekrar: hastalik ve besin dengesi kontrolu')
        if exceeds: concerns.append('Sezonluk FAO ET alt siniri, kullanici tarafindan verilen ET rehber limitinden yuksek')
        if unknown_water: concerns.append('Urun-ozel guvenilir sezonluk ET araligi yok; su uygunlugu bilinmiyor')
        if irrigated is False: concerns.append('Sulama bulunmadigi bildirildi; su dengesi yerel olarak incelenmeli')
        concerns.extend(['Ekim takvimi, pH, toprak teksturu, drenaj, zararli gecmisi ve pazar bilgisi dogrulanmali','Aylik yagis miktari ile mevsimsel ET dogrudan karsilastirilmadi'])
        results.append({
            'id':'current' if idx==0 else f'alternative_{idx}',
            'type':'current' if idx==0 else 'alternative',
            'cropSequence':seq,'cropNames':[a['name_tr'],b['name_tr']],
            'rotationBenefitToExplore':benefit,
            'indicativeSuitabilityIndex0to100':suitability,
            'indicativeBand':band(suitability),
            'waterEvidence':{'secondCropSeasonalEtGuideMm':[b['water_need_min_mm'],b['water_need_max_mm']] if et_min is not None else None,
                             'etLimitExceeded':bool(exceeds) if max_et is not None and et_min is not None else None,
                             'isIrrigationDemandEstimate':False},
            'risksAndLocalChecks':concerns,
            'evidenceLimitations':['Puanlar secilmis sezgisel agirliklarla uretilmistir; verim/tarimsal uygunluk modeline karsi kalibre edilmedi'],
            'yieldPrediction':None, 'successProbability':None
        })
    # Scores are only within the same scenario. A change is not a real-world predicted effect.
    result={
        'status':'exploratory_scenario_and_rotation',
        'location':{'requestedLat':lat,'requestedLon':lon,'gridLat':float(frow.LAT),'gridLon':float(frow.LON)},
        'historicalClimate':{'referencePeriod':'2006-2025','monthlyMeanPrecipitationMm':optional(frow,'precipitation_mm_reference_mean'),
                             'monthlyMeanTemperatureC':optional(frow,'temperature_c_reference_mean')},
        'forecast':{'validMonth':requested,'temperatureC':optional(frow,'forecast_temperature_c'),
                    'soilWetnessWet3Index':optional(frow,'forecast_wet3_index',4),'monthlyPrecipitationMm':rain_forecast,
                    'temperatureInitialization':optional_text(frow,'t2m_init_date'),
                    'soilMoistureInitialization':optional_text(frow,'wet3_init_date'),
                    'precipitationInitialization':optional_text(frow,'rain_init_date'),
                    'ensembleMembersT2M':selected_month['variableForecasts']['temperature']['ensembleMembers'],
                    'ensembleMembersWET3':selected_month['variableForecasts']['soilMoisture']['ensembleMembers']},
        'monthlyForecasts':monthly,
        'forecastCoverage':{k:v for k,v in fc.attrs['quality'].items() if k != 'inventory'},
        'climateSummary':{'historicalBaseline':selected_month['historicalBaseline'],
                          'temperatureDifferenceCUnadjusted':selected_month['temperatureDifferenceCUnadjusted'],
                          'precipitationDifferencePctUnadjusted':selected_month['precipitationDifferencePctUnadjusted'],
                          'comparisonStatus':'uncalibrated_cross_product_comparison',
                          'usedInRotationScoring':False},
        'farmerInputs':farmer,
        'scenario':scenario,
        'historicalStressContext':{'period':'2025-11','historicalExploratoryStressIndex':optional(histrow,'climate_stress_score_0_100') if histrow is not None else None,
                                   'isCurrentOrForecast':False},
        'scenarioAnalysis':{'mode':'user_hypothetical_not_nasa_forecast','rainfallChangePct':rain_pct,
                            'temperatureChangeC':temp_delta,'irrigationAvailabilityChangePct':irrigation_change,
                            'indicativeScenarioPressureIndex0to100':round(scenario_pressure,1),
                            'formula':'clip(50 - 0.35*rainfallChangePct + 3*temperatureChangeC - 0.12*irrigationAvailabilityChangePct, 0,100)',
                            'projectedMonthlyPrecipitationMm':round(rain_forecast*(1+rain_pct/100),3) if rain_forecast is not None else None,
                            'precipitationBaseSource':'NASA GEOS-S2S' if rain_forecast is not None else None,
                            'projectedMonthlyTemperatureC':round(selected_month['temperatureC']+temp_delta,3) if selected_month['temperatureC'] is not None else None},
        'rotationStrategies':results,
        'modelType':'explainable_heuristic_no_trained_ml',
        'inputHandling':{'climateSummary':'reserved_not_used_in_scoring','forecast':'month selects supplied GEOS context; forecast values are explanatory and not used in rotation scoring','farmerInputs':'currentRotation, availableCrops, irrigationAvailable, maxSeasonalCropWaterNeedMm','scenario':'rainfallChangePct, temperatureChangeC, irrigationAvailabilityChangePct'},
        'limitations':['Sayisal indeksler kalibre edilmis kuraklik olasiligi veya urun basarisi degildir',
                       'Tahminler tek ensemble uyesidir; ensemble ortalamasi veya guven araligi hesaplanmadi. CSV uye bilgisi disaktarma koduna dayanir',
                       'GEOS T2M ve WET3 ayri baslangic tarihlerinden geliyor',
                       'GEOS WET3 ile POWER GWETROOT dogrudan karsilastirilmaz',
                       'Eksik yagis/toprak nemi tahminleri null; tarihsel ortalamalar tahmin yerine kullanilmaz',
                       'Aylik referans ortalamalari POWER 2006-2025 verilerinden hesaplandi; tarihsel 2025 stres indeksi eski 2006-2024 referansini korur',
                       'GEOS-S2S ve POWER farklari yanlilik duzeltmesi yapilmamis kaynaklar arasi karsilastirmadir; kalibre anomali veya kesin risk degildir',
                       'En yakin grid tarla olceginde bir gozlem degildir',
                       'Toprak, sulama ve yerel tarim uzmani dogrulamasi zorunludur'],
        'sources':['https://www.fao.org/4/s2022e/s2022e07.htm', 'https://www.fao.org/4/Y5146E/y5146e0a.htm']
    }
    return result
