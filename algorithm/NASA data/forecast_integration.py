"""GEOS-S2S context; run this file to write output/forecast_integration/ only."""
from pathlib import Path
from datetime import datetime
import calendar
import json
import re
import numpy as np
import pandas as pd
from netCDF4 import Dataset, num2date
from shapely.geometry import Point, shape

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
OUT = ROOT / 'output' / 'forecast_integration'
TEMPERATURE = ROOT / 'turkiye_tahmin_sicaklik_yagis_9ay.csv'
HISTORY = ROOT / 'turkiye_birlesik_iklim_2006_2025.csv'
BOUNDARY = ROOT / 'turkiye_siniri_naturalearth.geojson'
RAIN_VARIABLES = ('PRECTOT', 'PRECTOTCORR', 'PRECTOTLAND', 'precipitation', 'pr')
PREFIXES = {'T2M': 't2m', 'WET3': 'wet3', **{v: 'rain' for v in RAIN_VARIABLES}}
VALUE_COLUMNS = {'t2m': 'forecast_temperature_c', 'wet3': 'forecast_wet3_index',
                 'rain': 'forecast_precipitation_mm'}


def turkey_points(frame, boundary=BOUNDARY):
    """Same Natural Earth TUR polygons/covers rule as the historical pipeline."""
    coords = frame[['LAT', 'LON']].drop_duplicates().copy()
    if not (np.isfinite(coords).all().all() and coords.LAT.between(-90, 90).all()
            and coords.LON.between(-180, 180).all()):
        raise ValueError('Gecersiz veya eksik koordinat')
    with Path(boundary).open(encoding='utf-8') as fh:
        geo = json.load(fh)
    polygons = [shape(f['geometry']) for f in geo['features']
                if f.get('properties', {}).get('iso_a3') == 'TUR']
    if not polygons:
        raise ValueError('TUR sinir geometrisi yok')
    inside = [any(p.covers(Point(lon, lat)) for p in polygons)
              for lat, lon in coords.itertuples(index=False, name=None)]
    return frame.merge(coords.loc[inside], on=['LAT', 'LON'], validate='many_to_one')


def convert_values(values, variable, units, month):
    """Monthly mean precipitation flux -> accumulation in the VALID month."""
    values = np.asarray(values, dtype=float).copy()
    values[(~np.isfinite(values)) | (np.abs(values) > 1e10) | (values == -999)] = np.nan
    unit = units.strip().lower().replace('**', '^')
    if variable == 'T2M':
        if unit not in ('k', 'kelvin'):
            raise ValueError(f'T2M birimi Kelvin olmali: {units}')
        values[values <= 0] = np.nan
        return values - 273.15
    if variable == 'WET3':
        if unit != '1':
            raise ValueError(f'WET3 boyutsuz olmali: {units}')
        values[(values < 0) | (values > 1)] = np.nan
        return values
    days = calendar.monthrange(*map(int, month.split('-')))[1]
    factors = {'mm': 1, 'kg m-2': 1, 'kg m^-2': 1,
               'mm/day': days, 'mm day-1': days, 'mm d-1': days,
               'kg m-2 s-1': days * 86400, 'kg m^-2 s^-1': days * 86400,
               'mm/s': days * 86400, 'm/s': days * 86400000}
    if unit not in factors:
        raise ValueError(f'Dogrulanmamis yagis birimi: {units}')
    values[values < 0] = np.nan
    return values * factors[unit]


def read_temperature_csv(path=TEMPERATURE):
    """Supplied export: Kelvin; ens1 provenance is explicit in veri_deneme3.py."""
    path = Path(path)
    raw = pd.read_csv(path, dtype={'baslangic_tarihi': str})
    required = {'time', 'lat', 'lon', 'T2M', 'lead_ay', 'baslangic_tarihi'}
    if not required.issubset(raw.columns):
        raise ValueError(f'{path.name}: eksik sutunlar {sorted(required - set(raw.columns))}')
    dates = pd.to_datetime(raw.time, errors='raise')
    init = pd.to_datetime(raw.baslangic_tarihi, format='%Y%m%d', errors='raise')
    if dates.isna().any() or init.isna().any():
        raise ValueError(f'{path.name}: eksik tarih')
    raw['valid_month'] = dates.dt.strftime('%Y-%m')
    raw['initialization_date'] = init.dt.strftime('%Y-%m-%d')
    expected = (dates.dt.year - init.dt.year) * 12 + dates.dt.month - init.dt.month
    if not pd.to_numeric(raw.lead_ay, errors='raise').eq(expected).all():
        raise ValueError(f'{path.name}: lead_ay ve gecerlilik ayi uyusmuyor')
    if raw.duplicated(['lat', 'lon', 'valid_month', 'initialization_date']).any():
        raise ValueError(f'{path.name}: tekrarlanan koordinat-tarih')
    raw = raw.rename(columns={'lat': 'LAT', 'lon': 'LON'})
    for c in ('LAT', 'LON', 'T2M'):
        raw[c] = pd.to_numeric(raw[c], errors='raise')
    selected = turkey_points(raw)
    if selected.empty:
        raise ValueError(f'{path.name}: Turkiye icinde nokta yok')
    fields = []
    for (month, run), group in selected.groupby(['valid_month', 'initialization_date'], sort=True):
        fields.append(dict(init=run, valid_month=month, member=1,
                           member_evidence='veri_deneme3.py selects .at.ens1.lead; CSV has no member column',
                           lead=int(group.lead_ay.iloc[0]), variable='T2M', units='K',
                           lat=group.LAT.to_numpy(), lon=group.LON.to_numpy(),
                           values=convert_values(group.T2M, 'T2M', 'K', month), source=path.name))
    quality = {'sourceFile': path.name, 'inputRows': len(raw),
               'inputPoints': len(raw[['LAT', 'LON']].drop_duplicates()),
               'retainedRows': len(selected),
               'retainedPoints': len(selected[['LAT', 'LON']].drop_duplicates()),
               'excludedRowsOutsideTurkey': len(raw) - len(selected), 'duplicateRecords': 0,
               'missingValues': sum(int(np.isnan(f['values']).sum()) for f in fields)}
    counts = selected.groupby(['LAT', 'LON']).valid_month.nunique()
    quality['pointsWithIncompleteMonths'] = int(counts.ne(raw.valid_month.nunique()).sum())
    return fields, quality


def read_netcdf(path):
    """Inspect variables and decode actual time values, including offsets."""
    path = Path(path)
    fields = []
    with Dataset(path) as ds:
        variables = [v for v in PREFIXES if v in ds.variables]
        if not variables:
            return fields
        match = re.fullmatch(r'(\d{8})\.[^.]+\.ens(\d+)\.lead(\d+)\.nc4?', path.name, re.I)
        if not match:
            raise ValueError(f'{path.name}: baslangic/ensemble/lead dogrulanamadi')
        init, member, lead = match.groups()
        time = ds.variables['time']
        dates = num2date(time[:], time.units, calendar=getattr(time, 'calendar', 'standard'))
        lat, lon = np.meshgrid(ds.variables['lat'][:], ds.variables['lon'][:], indexing='ij')
        coords = pd.DataFrame({'LAT': lat.ravel(), 'LON': ((lon.ravel() + 180) % 360) - 180})
        if not np.isfinite(coords).all().all() or not coords.LAT.between(-90, 90).all():
            raise ValueError(f'{path.name}: gecersiz koordinat')
        if coords.duplicated(['LAT', 'LON']).any():
            raise ValueError(f'{path.name}: tekrarlanan koordinat')
        coords['index'] = np.arange(len(coords))
        coords = turkey_points(coords[coords.LAT.between(35, 43) & coords.LON.between(25, 45)])
        if coords.empty:
            raise ValueError(f'{path.name}: Turkiye icinde nokta yok')
        for variable in variables:
            var = ds.variables[variable]
            if var.dimensions != ('time', 'lat', 'lon'):
                raise ValueError(f'{path.name}: beklenmeyen {variable} boyutlari {var.dimensions}')
            for i, date in enumerate(dates):
                month = f'{date.year:04d}-{date.month:02d}'
                values = np.ma.asarray(var[i], dtype=float).filled(np.nan).ravel()[coords['index']]
                fields.append(dict(init=datetime.strptime(init, '%Y%m%d').strftime('%Y-%m-%d'),
                                   valid_month=month, member=int(member), lead=int(lead),
                                   member_evidence=path.name, variable=variable, units=var.units,
                                   lat=coords.LAT.to_numpy(), lon=coords.LON.to_numpy(),
                                   values=convert_values(values, variable, var.units, month), source=path.name))
    return fields


def read_variable(path):
    """Compatibility for callers of the old single-variable reader."""
    fields = read_netcdf(path)
    return fields[0] if fields else None


def read_rainfall_csv(path):
    """Require forecast dates and explicit units; never treat history as forecasts."""
    header = pd.read_csv(path, nrows=0)
    variables = [v for v in RAIN_VARIABLES if v in header.columns]
    if not variables or 'time' not in header or 'baslangic_tarihi' not in header:
        return []
    raw = pd.read_csv(path, dtype={'baslangic_tarihi': str})
    required = {'lat', 'lon', 'units', 'ensemble_member'}
    if not required.issubset(raw.columns) or len(variables) != 1:
        raise ValueError(f'{path.name}: yagis birim/ensemble/koordinat bilgisi eksik veya belirsiz')
    variable = variables[0]
    raw['valid_month'] = pd.to_datetime(raw.time, errors='raise').dt.strftime('%Y-%m')
    raw['init'] = pd.to_datetime(raw.baslangic_tarihi, format='%Y%m%d', errors='raise').dt.strftime('%Y-%m-%d')
    if raw[['valid_month', 'init', 'units', 'ensemble_member']].isna().any().any():
        raise ValueError(f'{path.name}: eksik tahmin meta verisi')
    if raw.duplicated(['lat', 'lon', 'valid_month', 'init', 'ensemble_member']).any():
        raise ValueError(f'{path.name}: tekrarlanan koordinat-tarih')
    raw = turkey_points(raw.rename(columns={'lat': 'LAT', 'lon': 'LON'}))
    fields = []
    for (month, init, member, units), group in raw.groupby(['valid_month', 'init', 'ensemble_member', 'units']):
        fields.append(dict(init=init, valid_month=month, member=int(member), units=units,
                           member_evidence=path.name, variable=variable, lead=None,
                           lat=group.LAT.to_numpy(), lon=group.LON.to_numpy(),
                           values=convert_values(group[variable], variable, units, month), source=path.name))
    return fields


def nearest(field, loc):
    """Map filtered GEOS points to POWER coordinates, with a distance guard."""
    distances = ((field['lat'][:, None] - loc.LAT.to_numpy()[None, :]) ** 2
                 + ((field['lon'][:, None] - loc.LON.to_numpy()[None, :])
                    * np.cos(np.radians(loc.LAT.to_numpy()))[None, :]) ** 2)
    indices = distances.argmin(axis=0)
    values = field['values'][indices].copy()
    values[np.sqrt(distances[indices, np.arange(len(loc))]) > 0.75] = np.nan
    return values, field['lat'][indices], field['lon'][indices]


def historical_baseline(path=HISTORY):
    raw = pd.read_csv(path, usecols=['LAT', 'LON', 'YEAR', 'MONTH', 'temperature_c', 'precipitation_mm'])
    if raw.duplicated(['LAT', 'LON', 'YEAR', 'MONTH']).any():
        raise ValueError('Tekrarlanan tarihsel koordinat-yil-ay')
    raw = turkey_points(raw.loc[raw.YEAR.between(2006, 2025)].copy())
    raw[['temperature_c', 'precipitation_mm']] = raw[['temperature_c', 'precipitation_mm']].replace([-999, np.inf, -np.inf], np.nan)
    raw.loc[raw.precipitation_mm < 0, 'precipitation_mm'] = np.nan
    return raw.groupby(['LAT', 'LON', 'MONTH'], as_index=False).agg(
        temperature_c_reference_mean=('temperature_c', 'mean'),
        precipitation_mm_reference_mean=('precipitation_mm', 'mean'),
        temperature_reference_year_count=('temperature_c', 'count'),
        precipitation_reference_year_count=('precipitation_mm', 'count'))


def build_forecasts():
    fields, quality = read_temperature_csv()
    inventory, warnings = [], []
    paths = sorted(p for p in ROOT.rglob('*') if p.suffix.lower() in ('.csv', '.nc', '.nc4')
                   and not any(part.startswith('.') for part in p.relative_to(ROOT).parts)
                   and OUT not in p.parents)
    for path in paths:
        if path.suffix.lower() == '.csv':
            cols = pd.read_csv(path, nrows=0).columns.tolist()
            inventory.append({'file': str(path.relative_to(ROOT)), 'variables': [v for v in PREFIXES if v in cols]})
            fields.extend(read_rainfall_csv(path))
        else:
            try:
                extra = read_netcdf(path)
            except OSError:
                warnings.append(f'{path.name}: okunamayan NetCDF; dosya boyutu {path.stat().st_size} bayt')
                continue
            fields.extend(extra)
            inventory.append({'file': str(path.relative_to(ROOT)), 'variables': sorted({f['variable'] for f in extra})})
    baseline = historical_baseline()
    records, grouped = [], {}
    for f in fields:
        grouped.setdefault((f['valid_month'], PREFIXES[f['variable']]), []).append(f)
    # Never blend runs/members. The requested nine-month export has T2M priority.
    for (month, prefix), candidates in sorted(grouped.items()):
        primary = [f for f in candidates if f['source'] == TEMPERATURE.name]
        candidates = primary or candidates
        latest = max(f['init'] for f in candidates)
        candidates = [f for f in candidates if f['init'] == latest]
        if len(candidates) != 1:
            raise ValueError(f'{month}/{prefix}: birden fazla uye veya cakisan dosya; ortalama alinmadi')
        f = candidates[0]
        loc = baseline.loc[baseline.MONTH.eq(int(month[-2:])), ['LAT', 'LON']].copy()
        values, grid_lat, grid_lon = nearest(f, loc)
        loc['valid_month'] = month
        loc[VALUE_COLUMNS[prefix]] = values
        loc[prefix + '_init_date'] = f['init']
        loc[prefix + '_member_count'], loc[prefix + '_member'] = 1, f['member']
        loc[prefix + '_member_evidence'] = f['member_evidence']
        loc[prefix + '_variable'], loc[prefix + '_units'] = f['variable'], f['units']
        loc[prefix + '_grid_lat'], loc[prefix + '_grid_lon'] = grid_lat, grid_lon
        loc[prefix + '_files'] = f['source']
        records.append((prefix, loc))
    combined = None
    for prefix in VALUE_COLUMNS:
        subsets = [loc for p, loc in records if p == prefix]
        if not subsets:
            continue
        part = pd.concat(subsets, ignore_index=True)
        combined = part if combined is None else combined.merge(part, on=['LAT', 'LON', 'valid_month'], how='outer', validate='one_to_one')
    for prefix, column in VALUE_COLUMNS.items():
        for c in (column, prefix + '_init_date', prefix + '_member_count', prefix + '_member',
                  prefix + '_member_evidence', prefix + '_variable', prefix + '_units',
                  prefix + '_grid_lat', prefix + '_grid_lon', prefix + '_files'):
            if c not in combined:
                combined[c] = np.nan
    combined['MONTH'] = combined.valid_month.str[-2:].astype(int)
    combined = combined.merge(baseline, on=['LAT', 'LON', 'MONTH'], validate='many_to_one')
    combined['temperature_difference_vs_power_c_unadjusted'] = combined.forecast_temperature_c - combined.temperature_c_reference_mean
    combined['precipitation_difference_vs_power_pct_unadjusted'] = (
        100 * (combined.forecast_precipitation_mm - combined.precipitation_mm_reference_mean)
        / combined.precipitation_mm_reference_mean.where(combined.precipitation_mm_reference_mean > 0))
    combined['temperature_comparison_status'] = 'uncalibrated_cross_product_comparison'
    combined['forecast_scope'] = 'monthly_grid_context_not_field_level'
    combined = combined.sort_values(['valid_month', 'LAT', 'LON']).reset_index(drop=True)
    months = {p: sorted(combined.loc[combined[c].notna(), 'valid_month'].unique().tolist())
              for p, c in VALUE_COLUMNS.items()}
    if not months['rain']:
        warnings.append('Yagis tahmin dosyasi bulunamadi; tarihsel ortalamalar tahmin yerine kullanilmadi')
    quality.update({'availableMonths': months, 'warnings': warnings, 'inventory': inventory,
                    'referencePeriod': '2006-2025',
                    'spatialMapping': 'nearest Turkey-covered GEOS point to POWER grid; max 0.75 degree scaled distance',
                    'temperaturePriority': 'nine-month CSV; other temperature exports are not blended'})
    combined.attrs['quality'] = quality
    return combined


def main():
    combined = build_forecasts()
    OUT.mkdir(parents=True, exist_ok=True)
    combined.to_csv(OUT / 'monthly_forecast_context.csv', index=False, encoding='utf-8-sig')
    (OUT / 'quality_report.json').write_text(json.dumps(combined.attrs['quality'], ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(combined.attrs['quality'], ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
