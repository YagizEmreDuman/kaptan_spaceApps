"""NASA POWER Türkiye: 2006-2025 aylık yağış, sıcaklık ve toprak ıslaklığı.

Kurulum: pip install pandas numpy shapely
Çalıştırma: python gorev7_birlesik_iklim.py

Referans 2006-2024 sabittir: betimleyici analiz içindir, geçmiş yıllara
bakılarak bir tahmin modeli eğitilirken veri sızıntısı olmaması için
referanslar eğitim penceresinde ayrıca yeniden hesaplanmalıdır.
"""
from pathlib import Path
import json
import calendar
import numpy as np
import pandas as pd
from shapely.geometry import shape, Point

BASE = Path(__file__).resolve().parent
INPUT = BASE / 'turkiye_20_yillik_iklim_ve_toprak_nemi.csv'
BOUNDARY = BASE / 'turkiye_siniri_naturalearth.geojson'
OUTPUT = BASE / 'output'
PARAMETERS = ['PRECTOTCORR','T2M','GWETTOP','GWETROOT']
MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
BASELINE_START, BASELINE_END = 2006, 2024


def run():
    OUTPUT.mkdir(exist_ok=True, parents=True)
    raw = pd.read_csv(INPUT, encoding='utf-8-sig')
    required = {'PARAMETER','YEAR','LAT','LON', *MONTHS}
    if not required.issubset(raw.columns):
        raise ValueError(f'Eksik CSV sütunları: {required-set(raw.columns)}')
    if set(raw.PARAMETER.dropna().unique()) != set(PARAMETERS):
        raise ValueError('Beklenmeyen veya eksik iklim parametresi')
    if raw.duplicated(['PARAMETER','YEAR','LAT','LON']).any():
        raise ValueError('Tekrarlanan parametre/yıl/koordinat')
    with BOUNDARY.open(encoding='utf-8') as f:
        geo = json.load(f)
    polygons = [shape(feat['geometry']) for feat in geo['features']
                if feat.get('properties',{}).get('iso_a3') == 'TUR']
    if not polygons:
        raise ValueError('TUR sınır geometrisi yok')

    coords = raw[['LAT','LON']].drop_duplicates().copy()
    coords['inside'] = [any(p.covers(Point(lon,lat)) for p in polygons)
                        for lat,lon in coords[['LAT','LON']].itertuples(index=False,name=None)]
    kept = coords[coords.inside][['LAT','LON']]
    selected = raw.merge(kept,on=['LAT','LON'],how='inner',validate='many_to_one').copy()
    melted = selected.melt(id_vars=['PARAMETER','YEAR','LAT','LON'],value_vars=MONTHS,
                           var_name='MONTH_CODE',value_name='value')
    melted['MONTH'] = melted['MONTH_CODE'].map({name:i for i,name in enumerate(MONTHS,1)}).astype(int)
    melted['value'] = pd.to_numeric(melted.value,errors='coerce').replace(-999,np.nan)
    merged = melted.pivot(index=['LAT','LON','YEAR','MONTH'],columns='PARAMETER',values='value').reset_index()
    merged.columns.name = None
    merged['YEAR'] = merged.YEAR.astype(int)
    merged['date'] = pd.to_datetime(dict(year=merged.YEAR,month=merged.MONTH,day=1))
    merged['days_in_month'] = [calendar.monthrange(int(y),int(m))[1]
                               for y,m in zip(merged.YEAR,merged.MONTH)]
    merged['precipitation_mm'] = merged.PRECTOTCORR * merged.days_in_month
    merged = merged.rename(columns={'T2M':'temperature_c', 'GWETTOP':'soil_wetness_top',
                                     'GWETROOT':'soil_wetness_root', 'PRECTOTCORR':'precipitation_mm_day'})
    if merged[['precipitation_mm','temperature_c','soil_wetness_top']].isna().any().any():
        raise ValueError('Yağış/sıcaklık/üst toprak nemi eksikleri var; kontrol edin')
    if (merged.precipitation_mm < 0).any():
        raise ValueError('Negatif yağış değeri')

    fields = ['precipitation_mm','temperature_c','soil_wetness_top','soil_wetness_root']
    baseline = (merged.loc[merged.YEAR.between(BASELINE_START,BASELINE_END)]
                .groupby(['LAT','LON','MONTH'],as_index=False)[fields].agg(['mean','count','std']))
    baseline.columns = ['LAT','LON','MONTH'] + [f'{col}_reference_{stat}'
                     for col in fields for stat in ('mean','count','std')]
    merged = merged.merge(baseline,on=['LAT','LON','MONTH'],validate='many_to_one')
    for col in fields:
        merged[f'{col}_anomaly'] = merged[col] - merged[f'{col}_reference_mean']
    merged['precipitation_anomaly_pct'] = np.where(
        merged.precipitation_mm_reference_mean > 0,
        100*merged.precipitation_mm_anomaly/merged.precipitation_mm_reference_mean,np.nan)
    merged = merged.sort_values(['LAT','LON','date']).reset_index(drop=True)
    groups = merged.groupby(['LAT','LON'],sort=False)
    for col in ['precipitation_mm','precipitation_mm_reference_mean']:
        merged[f'{col}_3m'] = groups[col].transform(lambda s:s.rolling(3,min_periods=3).sum())
    merged['precipitation_3m_anomaly_pct'] = np.where(
        merged.precipitation_mm_reference_mean_3m > 0,
        100*(merged.precipitation_mm_3m-merged.precipitation_mm_reference_mean_3m)
        /merged.precipitation_mm_reference_mean_3m,np.nan)
    merged['dry_month_flag_exploratory'] = (merged.precipitation_anomaly_pct <= -20).astype('Int64')
    merged.loc[merged.precipitation_anomaly_pct.isna(),'dry_month_flag_exploratory'] = pd.NA
    merged['baseline_period'] = f'{BASELINE_START}-{BASELINE_END}'
    merged['date'] = merged.date.dt.strftime('%Y-%m')
    path = OUTPUT / 'turkiye_birlesik_iklim_2006_2025.csv'
    merged.to_csv(path,index=False,encoding='utf-8-sig',float_format='%.5f')
    baseline.to_csv(OUTPUT/'turkiye_aylik_iklim_referansi_2006_2024.csv',index=False,
                    encoding='utf-8-sig',float_format='%.5f')
    latest = merged[merged.YEAR==2025].copy()
    latest.to_csv(OUTPUT/'turkiye_2025_iklim_anomalileri.csv',index=False,
                  encoding='utf-8-sig',float_format='%.5f')
    report = {
        'source':'NASA POWER regional, source MERRA-2; user-provided CSV',
        'input_grid_points':int(len(coords)),
        'turkey_grid_centers':int(len(kept)),
        'excluded_grid_centers':int(len(coords)-len(kept)),
        'monthly_rows':int(len(merged)),
        'years': [int(merged.YEAR.min()),int(merged.YEAR.max())],
        'baseline':'2006-2024 (19 years, not WMO 30-year normal)',
        'missing_by_field':{k:int(merged[k].isna().sum()) for k in fields},
        'root_wetness_missing_grid_months':int(merged.soil_wetness_root.isna().sum()),
        'rainfall_3m_start_missing':int(merged.precipitation_mm_3m.isna().sum()),
        'notes':['Türkiye sınırında merkez noktası bulunan ızgaralar tutuldu; kıyı hücrelerinin alan ağırlığı yok.',
                 'GWETTOP/GWETROOT ıslaklık göstergeleridir; yüzde su içeriği olarak yorumlanmaz.',
                 'Eksik GWETROOT değerleri doldurulmadı.',
                 '2006-2024 referansı geçmiş yılların analizi içindir, geçmişe dönük model tahmininde veri sızıntısı yaratabilir.',
                 'Yağış anomalisinin -%20 altında olması doğrulanmış kuraklık sınıfı değildir.']
    }
    (OUTPUT/'kalite_raporu.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    print('Dosyalar:',path,sep='\n')


if __name__ == '__main__':
    run()
