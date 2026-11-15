"""Start: uvicorn api:app --host 127.0.0.1 --port 5000"""
from typing import Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from decision_engine import assess, crop_catalog, forecasts

app=FastAPI(title='NASA Smart Farming - Tasks 11 and 12',version='0.5.0')

class PredictionRequest(BaseModel):
    location:dict[str,Any]
    climateSummary:dict[str,Any]=Field(default_factory=dict)
    forecast:dict[str,Any]=Field(default_factory=dict)
    farmerInputs:dict[str,Any]=Field(default_factory=dict)
    scenario:dict[str,Any]=Field(default_factory=dict)

@app.get('/health')
def health():
    return {'status':'ok','version':'0.5.0'}

@app.get('/catalog')
def catalog():
    """Frontend choices and forecast coverage come from the same data as /predict."""
    frame = forecasts()
    return {
        'crops': [
            {'id': row['id'], 'name': row['name_tr'], 'family': row['family'],
             'seasonalEtGuideMm': [row['water_need_min_mm'], row['water_need_max_mm']]
                if row['water_need_min_mm'] is not None else None,
             'waterNeedNote': row['water_need_note']}
            for row in crop_catalog().values()
        ],
        'forecastMonths': sorted(frame.valid_month.unique().tolist()),
        'forecastCoverage': frame.attrs['quality']['availableMonths'],
        'referencePeriod': frame.attrs['quality']['referencePeriod'],
        'scope': 'Turkey monthly GEOS-S2S context; no daily weather or planting dates',
    }

@app.post('/predict', summary='Rotation scenarios with monthly GEOS-S2S forecast context',
          description='Preserves existing fields and adds monthlyForecasts. Missing forecasts are null; historical baselines and uncalibrated differences are separate.')
def predict(payload:PredictionRequest):
    try:
        return assess(payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
