from fastapi.testclient import TestClient
from api import app
from decision_engine import crop_catalog, forecasts


def test_catalog_matches_actual_algorithm_inputs_and_months():
    response = TestClient(app).get('/catalog')
    assert response.status_code == 200
    data = response.json()
    assert {crop['id'] for crop in data['crops']} == set(crop_catalog())
    assert len(data['crops']) == 6
    assert data['forecastMonths'] == sorted(forecasts().valid_month.unique().tolist())
    assert data['forecastCoverage']['rain'] == []
    assert data['referencePeriod'] == '2006-2025'
    assert next(crop for crop in data['crops'] if crop['id'] == 'chickpea')['seasonalEtGuideMm'] is None
