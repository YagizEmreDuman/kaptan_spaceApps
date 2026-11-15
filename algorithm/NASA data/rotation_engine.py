"""Explainable crop-rotation OPTIONS, not validated agronomic prescriptions.
Source notes: FAO s2022e07 and Y5146E. Water ranges are crop ET guides,
NOT irrigation requirements and NOT guaranteed suitability thresholds.
"""
from __future__ import annotations
import csv
from pathlib import Path
from typing import Any

CROPS_PATH = Path(__file__).resolve().parent / 'data' / 'urun_katalogu.csv'


def catalog() -> dict[str, dict[str, Any]]:
    with CROPS_PATH.open(encoding='utf-8-sig', newline='') as f:
        items = list(csv.DictReader(f))
    for item in items:
        for k in ('water_need_min_mm', 'water_need_max_mm'):
            item[k] = float(item[k]) if item[k] else None
    return {item['id']: item for item in items}


def sequence_options(current: list[str], allowed: list[str], crops: dict) -> list[list[str]]:
    """Construct current + 2 DISTINCT alternatives preserving first/current crop.
    If no appropriate alternatives are available, return fewer, never fabricate.
    """
    base = current[-2:] if len(current) >= 2 else [current[0], current[0]]
    candidates = [base]
    first = base[0]
    for preferred in ('chickpea', 'lentil', 'sunflower', 'barley', 'wheat', 'maize'):
        if preferred in allowed and preferred in crops:
            trial = [first, preferred]
            if trial not in candidates:
                candidates.append(trial)
        if len(candidates) == 3:
            break
    return candidates


def assess_rotation(payload: dict[str, Any]) -> dict[str, Any]:
    crops = catalog()
    inputs = payload.get('farmerInputs') or {}
    scenario = payload.get('scenario') or {}
    current = inputs.get('currentRotation') or ['wheat', 'wheat']
    if not isinstance(current, list) or not current or any(c not in crops for c in current):
        raise ValueError('farmerInputs.currentRotation tanimli urun kodlari listesi olmali')
    allowed = inputs.get('availableCrops') or list(crops)
    if not isinstance(allowed, list) or any(c not in crops for c in allowed):
        raise ValueError('farmerInputs.availableCrops katalogdaki urun kodlarini icermeli')
    max_et = inputs.get('maxSeasonalCropWaterNeedMm')
    if max_et is not None:
        if isinstance(max_et, bool) or not isinstance(max_et, (int, float)) or max_et <= 0:
            raise ValueError('maxSeasonalCropWaterNeedMm pozitif sayi olmali')
    rainfall_change = scenario.get('rainfallChangePct')
    if rainfall_change is not None and (isinstance(rainfall_change, bool) or not isinstance(rainfall_change, (int, float)) or not -100 <= rainfall_change <= 300):
        raise ValueError('scenario.rainfallChangePct -100 ile 300 arasinda olmali')
    strategies = []
    for i, seq in enumerate(sequence_options(current, allowed, crops)):
        first, second = (crops[x] for x in seq)
        legume_break = first['family'] == 'cereal' and second['family'] == 'legume'
        same_family = first['family'] == second['family']
        explanations = []
        if legume_break:
            explanations.append('Tahildan sonra baklagil eklemek, uygun yerel kosullarda hastalik dongusunu kesmeye ve azot dongusune katki saglamaya yardimci olabilir.')
        if same_family:
            explanations.append('Ayni bitki ailesinin tekrarinda hastalik ve besin dengesi riskleri yerel olarak kontrol edilmelidir.')
        if not same_family and not legume_break:
            explanations.append('Bitki ailesi cesitliligi saglar; ancak bunun faydasi tarlaya ozgu kosullara baglidir.')
        water_info = []
        cautions = ['Toprak pH, tekstur, drenaj ve ekim-hasat takvimi bilinmiyor.', 'Hastalik/zararli gecmisi, pazar ve ekipman uygunlugu yerelde dogrulanmali.']
        for c in (first, second):
            range_known = c['water_need_min_mm'] is not None
            exceeds = bool(max_et is not None and range_known and c['water_need_min_mm'] > max_et)
            water_info.append({'crop': c['id'], 'seasonalEtGuideMm': [c['water_need_min_mm'], c['water_need_max_mm']] if range_known else None, 'lowerBoundExceedsUserEtLimit': exceeds})
            if not range_known:
                cautions.append(f"{c['name_tr']} icin urun-ozel su ihtiyaci araligi eksik; uygunluk hesaplanmadi.")
            elif exceeds:
                cautions.append(f"{c['name_tr']} icin FAO sezonluk ET alt siniri kullanicinin belirttigi limitin ustunde; bu sulama ihtiyaci hesaplamasi degildir.")
        strategies.append({
            'id': 'current' if i == 0 else f'alternative_{i}',
            'type': 'current' if i == 0 else 'alternative',
            'cropSequence': seq,
            'cropNames': [first['name_tr'], second['name_tr']],
            'benefitsToExplore': explanations,
            'waterEvidence': water_info,
            'localChecksRequired': list(dict.fromkeys(cautions)),
            'validatedYieldPrediction': None,
            'successProbability': None,
            'ranking': None,
        })
    warnings = [
        'Bunlar aciklanabilir rotasyon senaryolaridir; tarla bazinda dogrulanmis oneriler degildir.',
        'FAO sezonluk urun ET rehberleri sulama gereksinimi veya yagisla tek basina karsilastirilabilecek esikler degildir.',
        'Mevcut NASA GEOS-S2S dosyalarinda gelecege yonelik yagis tahmini bulunmuyor.',
        'WET3 tahminleri gecmis POWER GWETROOT ile dogrudan karsilastirilamaz.'
    ]
    if rainfall_change is not None:
        warnings.append(f'Senaryoda yagis %{rainfall_change:+g} degisimi kullanici varsayimidir; NASA tahmini degildir. Bu surumde rotasyon uygunluguna sayisal etki olarak uygulanmaz.')
    if len(strategies) < 3:
        warnings.append('Kullanici tarafindan izin verilen urunlerle uc farkli strateji olusturulamadi.')
    return {
        'rotationStrategies': strategies,
        'rotationAssessmentStatus': 'exploratory_rule_based_not_trained_ml',
        'catalogSize': len(crops),
        'farmerInputsUsed': True,
        'scenarioUsed': rainfall_change is not None,
        'limitations': warnings,
        'sources': [
            'https://www.fao.org/4/s2022e/s2022e07.htm',
            'https://www.fao.org/4/Y5146E/y5146e0a.htm'
        ]
    }
