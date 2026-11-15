from decision_engine import assess

BASE={
 'location':{'latitude':39.9334,'longitude':32.8597},
 'climateSummary':{},'forecast':{'month':'2026-11'},
 'farmerInputs':{'currentRotation':['wheat','wheat'], 'availableCrops':['wheat','chickpea','lentil'], 'irrigationAvailable':False},
 'scenario':{}
}
def test_three_strategies():
    r=assess(BASE)
    assert len(r['rotationStrategies'])==3
    assert r['forecast']['monthlyPrecipitationMm'] is None
    assert r['modelType']=='explainable_heuristic_no_trained_ml'

def test_scenario_changes_indicators():
    initial=assess(BASE)
    modified=assess({**BASE,'scenario':{'rainfallChangePct':-30, 'temperatureChangeC':2, 'irrigationAvailabilityChangePct':-20}})
    assert modified['scenarioAnalysis']['indicativeScenarioPressureIndex0to100']>initial['scenarioAnalysis']['indicativeScenarioPressureIndex0to100']
    assert modified['rotationStrategies'][0]['indicativeSuitabilityIndex0to100']<initial['rotationStrategies'][0]['indicativeSuitabilityIndex0to100']

def test_unknown_month_is_rejected():
    import pytest
    with pytest.raises(ValueError):
        assess({**BASE,'forecast':{'month':'2027-08'}})
