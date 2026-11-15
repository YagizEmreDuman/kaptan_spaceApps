"""Real supplied data checks; artificial rainfall exists ONLY in tmp_path tests."""
import copy
import json
import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from netCDF4 import Dataset

import forecast_integration as integration
from api import app
from decision_engine import assess, forecasts
from rotation_engine import assess_rotation

MONTHS = ['2026-11', '2026-12'] + [f'2027-{m:02d}' for m in range(1, 8)]
BASE = {'location': {'latitude': 39.9334, 'longitude': 32.8597},
        'climateSummary': {}, 'forecast': {},
        'farmerInputs': {'currentRotation': ['wheat', 'wheat'], 'irrigationAvailable': False},
        'scenario': {}}


def test_real_nine_month_export_and_kelvin_conversion():
    fields, report = integration.read_temperature_csv()
    assert report['inputRows'] == 4446 and report['inputPoints'] == 494
    assert len(fields) == 9
    assert [f['valid_month'] for f in fields] == MONTHS
    assert {f['init'] for f in fields} == {'2026-10-23'}
    assert report['missingValues'] == report['pointsWithIncompleteMonths'] == 0
    raw = pd.read_csv(integration.TEMPERATURE)
    f = fields[0]
    source = raw[(raw.lat == f['lat'][0]) & (raw.lon == f['lon'][0])].iloc[0]
    assert f['values'][0] == pytest.approx(source.T2M - 273.15)
    assert integration.convert_values([273.15], 'T2M', 'K', '2026-11')[0] == pytest.approx(0)


def test_turkey_polygon_filter_and_duplicate_detection(tmp_path):
    _, report = integration.read_temperature_csv()
    assert report['retainedPoints'] == 330
    assert report['excludedRowsOutsideTurkey'] == 1476
    points = pd.DataFrame({'LAT': [39.93, 38., 0.], 'LON': [32.86, 26., 0.]})
    kept = integration.turkey_points(points)
    assert len(kept) == 1 and kept.iloc[0].LON == 32.86
    raw = pd.read_csv(integration.TEMPERATURE)
    path = tmp_path / 'duplicate.csv'
    pd.concat([raw, raw.iloc[[0]]]).to_csv(path, index=False)
    with pytest.raises(ValueError, match='tekrarlanan koordinat-tarih'):
        integration.read_temperature_csv(path)


@pytest.mark.parametrize('field,value', [('lat', 91), ('lon', np.nan), ('lead_ay', 9), ('time', None)])
def test_invalid_source_records_rejected(tmp_path, field, value):
    raw = pd.read_csv(integration.TEMPERATURE)
    raw.loc[0, field] = value
    path = tmp_path / 'invalid.csv'
    raw.to_csv(path, index=False)
    with pytest.raises(ValueError):
        integration.read_temperature_csv(path)


def test_missing_values_are_not_zero_and_unknown_units_fail():
    assert np.isnan(integration.convert_values([-999, 1e15, np.nan], 'T2M', 'K', '2026-11')).all()
    with pytest.raises(ValueError, match='birimi'):
        integration.convert_values([10], 'T2M', 'C', '2026-11')
    with pytest.raises(ValueError, match='yagis birimi'):
        integration.convert_values([1], 'PRECTOT', 'unknown', '2026-11')


def test_missing_rain_soil_and_source_provenance():
    result = assess(BASE)
    assert [m['month'] for m in result['monthlyForecasts']] == MONTHS
    assert all(m['precipitationMm'] is None for m in result['monthlyForecasts'])
    assert all(m['precipitationDifferencePctUnadjusted'] is None for m in result['monthlyForecasts'])
    assert all(m['historicalBaseline']['precipitationMm'] is not None for m in result['monthlyForecasts'])
    assert result['monthlyForecasts'][0]['soilWetnessWet3Index'] is not None
    assert all(m['soilWetnessWet3Index'] is None for m in result['monthlyForecasts'][1:])
    assert result['forecast']['soilMoistureInitialization'] == '2026-10-28'
    assert result['forecast']['temperatureInitialization'] == '2026-10-23'
    assert result['monthlyForecasts'][0]['variableForecasts']['temperature']['sourceVariable'] == 'T2M'
    assert result['monthlyForecasts'][0]['variableForecasts']['temperature']['sourceUnits'] == 'K'
    assert result['forecastCoverage']['availableMonths']['rain'] == []
    assert any('temp_ay_8.nc4' in w for w in result['forecastCoverage']['warnings'])
    assert all(m['variableForecasts']['temperature']['ensembleMembers'] == 1 for m in result['monthlyForecasts'])


def test_full_2006_2025_baseline_matches_actual_history():
    result = assess(BASE)
    baseline = result['monthlyForecasts'][0]['historicalBaseline']
    raw = pd.read_csv(integration.HISTORY)
    rows = raw[(raw.LAT == baseline['gridLat']) & (raw.LON == baseline['gridLon']) & (raw.MONTH == 11)]
    assert set(rows.YEAR) == set(range(2006, 2026))
    assert baseline['temperatureYearCount'] == baseline['precipitationYearCount'] == 20
    assert baseline['temperatureC'] == pytest.approx(rows.temperature_c.mean(), abs=.000501)
    assert baseline['precipitationMm'] == pytest.approx(rows.precipitation_mm.mean(), abs=.000501)


@pytest.mark.parametrize('lat,lon', [(39.9334, 32.8597), (37.8746, 32.4932)])
def test_ankara_konya_predict_all_months_valid_json(lat, lon):
    client = TestClient(app)
    for month in MONTHS:
        payload = copy.deepcopy(BASE)
        payload['location'] = {'latitude': lat, 'longitude': lon}
        payload['forecast'] = {'month': month}
        response = client.post('/predict', json=payload)
        assert response.status_code == 200, response.text
        result = response.json()
        json.dumps(result, allow_nan=False)
        assert {'location', 'climateSummary', 'forecast', 'farmerInputs', 'scenario',
                'rotationStrategies', 'historicalClimate', 'scenarioAnalysis'} <= result.keys()
        assert result['forecast']['validMonth'] == month
        assert result['forecast']['temperatureC'] is not None
        assert len(result['monthlyForecasts']) == 9
        assert len(result['rotationStrategies']) == 3
        if month != '2026-11':
            assert result['forecast']['soilMoistureInitialization'] is None
            assert result['forecast']['ensembleMembersWET3'] is None


def test_existing_rotation_scores_and_scenario_preserved():
    initial = assess(BASE)
    changed = assess({**BASE, 'scenario': {'rainfallChangePct': -30, 'temperatureChangeC': 2,
                                         'irrigationAvailabilityChangePct': -20}})
    assert [r['indicativeSuitabilityIndex0to100'] for r in initial['rotationStrategies']] == [35, 54, 54]
    assert [r['indicativeSuitabilityIndex0to100'] for r in changed['rotationStrategies']] == [32, 51, 51]
    assert changed['scenarioAnalysis']['indicativeScenarioPressureIndex0to100'] == 68.9
    assert changed['scenarioAnalysis']['projectedMonthlyPrecipitationMm'] is None
    assert len(assess_rotation(BASE)['rotationStrategies']) == 3


def test_unknown_api_month_returns_422():
    response = TestClient(app).post('/predict', json={**BASE, 'forecast': {'month': '2027-08'}})
    assert response.status_code == 422


def test_two_month_rain_flux_and_actual_time_offsets_in_isolated_fixture(tmp_path, monkeypatch):
    # Artificial unit-test fixture, never a supplied NASA dataset or API output.
    path = tmp_path / '20261023.pr.ens1.lead1.nc4'
    with Dataset(path, 'w') as ds:
        for name, length in [('time', 2), ('lat', 1), ('lon', 1)]:
            ds.createDimension(name, length)
        ds.createVariable('lat', 'f8', ('lat',))[:] = [40.]
        ds.createVariable('lon', 'f8', ('lon',))[:] = [33.]
        t = ds.createVariable('time', 'f8', ('time',))
        t.units = 'days since 2026-10-01 00:00:00'
        t[:] = [31, 61]  # November, December: cannot parse only "since".
        rain = ds.createVariable('PRECTOT', 'f8', ('time', 'lat', 'lon'))
        rain.units = 'kg m-2 s-1'
        rain[:] = 1e-5
    fields = integration.read_netcdf(path)
    assert [f['valid_month'] for f in fields] == ['2026-11', '2026-12']
    assert fields[0]['values'][0] == pytest.approx(25.92)
    assert fields[1]['values'][0] == pytest.approx(26.784)
    monkeypatch.setattr(integration, 'ROOT', tmp_path)
    frame = integration.build_forecasts()
    assert frame.loc[frame.valid_month.eq('2026-11'), 'forecast_precipitation_mm'].notna().any()
    assert frame.loc[frame.valid_month.eq('2026-12'), 'forecast_precipitation_mm'].notna().any()
    assert frame.loc[frame.valid_month.str.startswith('2027'), 'forecast_precipitation_mm'].isna().all()
    monkeypatch.setattr('decision_engine.forecasts', lambda: frame)
    result = assess({**BASE, 'scenario': {'rainfallChangePct': -50}})
    assert result['forecast']['monthlyPrecipitationMm'] == pytest.approx(25.92)
    assert result['monthlyForecasts'][0]['variableForecasts']['precipitation']['sourceVariable'] == 'PRECTOT'
    assert result['monthlyForecasts'][0]['variableForecasts']['precipitation']['sourceUnits'] == 'kg m-2 s-1'
    assert result['scenarioAnalysis']['projectedMonthlyPrecipitationMm'] == pytest.approx(12.96)
    assert result['monthlyForecasts'][1]['precipitationMm'] == pytest.approx(26.784)
    assert all(m['precipitationMm'] is None for m in result['monthlyForecasts'][2:])
    baseline = result['monthlyForecasts'][0]['historicalBaseline']['precipitationMm']
    assert result['monthlyForecasts'][0]['precipitationDifferencePctUnadjusted'] == pytest.approx(
        100 * (25.92 - baseline) / baseline, abs=.001)


def test_rainfall_csv_requires_units_and_preserves_months(tmp_path):
    path = tmp_path / 'unit_test_rain.csv'
    raw = pd.DataFrame({'time': ['2026-11-01', '2026-12-01'],
                        'lat': [40., 40.], 'lon': [33., 33.],
                        'baslangic_tarihi': ['20261023', '20261023'],
                        'PRECTOT': [2., 2.], 'ensemble_member': [1, 1]})
    raw.to_csv(path, index=False)
    with pytest.raises(ValueError, match='yagis birim'):
        integration.read_rainfall_csv(path)
    raw['units'] = 'mm/day'
    raw.to_csv(path, index=False)
    fields = integration.read_rainfall_csv(path)
    assert [f['valid_month'] for f in fields] == ['2026-11', '2026-12']
    assert [f['values'][0] for f in fields] == [60., 62.]
    assert integration.read_rainfall_csv(integration.ROOT / 'turkiye_2006_2025_yagis_monthly.csv') == []


def test_rain_daily_flux_respects_leap_month():
    assert integration.convert_values([2], 'PRECTOT', 'mm/day', '2028-02')[0] == 58
    assert integration.convert_values([2], 'PRECTOT', 'mm/day', '2027-02')[0] == 56


def test_spatial_mapping_does_not_fill_from_remote_grid():
    f = {'lat': np.array([40.]), 'lon': np.array([33.]), 'values': np.array([12.])}
    values, _, _ = integration.nearest(f, pd.DataFrame({'LAT': [40., 36.], 'LON': [33., 40.]}))
    assert values[0] == 12 and np.isnan(values[1])
