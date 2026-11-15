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
            explanations.append('Planting a legume after cereal can help break disease cycles and contribute to nitrogen cycling under suitable local conditions.')
        if same_family:
            explanations.append('Repeating the same plant family requires local inspection of disease and nutrient balance risks.')
        if not same_family and not legume_break:
            explanations.append('Provides plant family diversity; however, its benefit depends on field-specific conditions.')
        water_info = []
        cautions = ['Soil pH, texture, drainage, and planting-harvest schedule are unknown.', 'Disease/pest history, market, and equipment suitability must be verified locally.']
        for c in (first, second):
            range_known = c['water_need_min_mm'] is not None
            exceeds = bool(max_et is not None and range_known and c['water_need_min_mm'] > max_et)
            water_info.append({'crop': c['id'], 'seasonalEtGuideMm': [c['water_need_min_mm'], c['water_need_max_mm']] if range_known else None, 'lowerBoundExceedsUserEtLimit': exceeds})
            if not range_known:
                cautions.append(f"Crop-specific water need range missing for {c['name_tr']}; suitability not calculated.")
            elif exceeds:
                cautions.append(f"FAO seasonal ET lower bound for {c['name_tr']} exceeds user-specified limit; this is not an irrigation requirement calculation.")
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
        'These are explainable rotation scenarios, not field-validated prescriptions.',
        'FAO seasonal crop ET guides are not irrigation requirements or thresholds directly comparable with rainfall alone.',
        'No future precipitation forecast is available in the raw NASA GEOS-S2S NetCDF files.',
        'WET3 forecasts cannot be directly compared with historical POWER GWETROOT.'
    ]
    if rainfall_change is not None:
        warnings.append(f'Scenario rainfall change of {rainfall_change:+g}% is a user assumption, not a NASA forecast.')
    if len(strategies) < 3:
        warnings.append('Could not generate three distinct strategies with user-permitted crops.')
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
