"""NASA POWER PRECTOTCORR verisinden Turkiye grid iklim analizi.

Kullanim:
    pip install pandas geopandas shapely
    python turkiye_iklim_analizi.py

Orijinal aylik CSV'yi bu dosyanin yanina koyun.
Boundary: Natural Earth lowres (public domain), paketle gelen geojson.
"""
from pathlib import Path
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

BASE_DIR = Path(__file__).resolve().parent
INPUT = BASE_DIR / 'turkiye_2006_2025_yagis_monthly.csv'
BOUNDARY = BASE_DIR / 'turkiye_siniri_naturalearth.geojson'
OUTPUT = BASE_DIR / 'output'
OUTPUT.mkdir(parents=True, exist_ok=True)


def main():
    if not INPUT.exists():
        raise FileNotFoundError(f'Girdi CSV bulunamadi: {INPUT}')
    if not BOUNDARY.exists():
        raise FileNotFoundError(f'Sinir GeoJSON dosyasi bulunamadi: {BOUNDARY}')
    df = pd.read_csv(INPUT, encoding='utf-8-sig')
    needed = {'LAT','LON','YEAR','MONTH','precipitation_mm','PARAMETER'}
    if not needed.issubset(df.columns):
        raise ValueError(f'Eksik sutunlar: {needed - set(df.columns)}')
    df = df[df['PARAMETER'].eq('PRECTOTCORR')].copy()
    for c in ['LAT','LON','YEAR','MONTH','precipitation_mm']:
        df[c] = pd.to_numeric(df[c], errors='coerce')
    df['precipitation_mm'] = df['precipitation_mm'].replace(-999, np.nan)
    if df[['LAT','LON','YEAR','MONTH']].isna().any().any():
        raise ValueError('Koordinat veya tarihte eksik deger var')
    df[['YEAR','MONTH']] = df[['YEAR','MONTH']].astype(int)
    if not df.MONTH.between(1,12).all():
        raise ValueError('Gecersiz ay degeri var')
    if df.duplicated(['LAT','LON','YEAR','MONTH']).any():
        raise ValueError('Tekrarlanan grid-yil-ay kayitlari var')
    if (df['precipitation_mm'].dropna() < 0).any():
        raise ValueError('Negatif aylik yagis var')

    country = gpd.read_file(BOUNDARY).to_crs('EPSG:4326')
    country = country[country['iso_a3'].eq('TUR')]
    if country.empty:
        raise ValueError('GeoJSON icinde TUR siniri bulunamadi')
    shape = country.geometry.union_all()
    coords = df[['LAT','LON']].drop_duplicates().copy()
    coords['in_turkiye'] = [shape.covers(Point(lon, lat)) for lat,lon in zip(coords.LAT, coords.LON)]
    df = df.merge(coords, on=['LAT','LON'], validate='many_to_one')
    df = df[df.in_turkiye].drop(columns='in_turkiye').copy()
    if df.empty:
        raise ValueError('Turkiye sinirinda grid noktasi bulunamadi')
    df['date'] = pd.to_datetime(dict(year=df.YEAR,month=df.MONTH,day=1))
    df = df.sort_values(['LAT','LON','date']).reset_index(drop=True)

    # Referans 2006-2024: 2025 karsilastirmasinda 2025'i referansa katma.
    reference = (df[df.YEAR.between(2006,2024)]
         .groupby(['LAT','LON','MONTH'],as_index=False)
         .agg(reference_2006_2024_mm=('precipitation_mm','mean'),
              reference_year_count=('precipitation_mm','count'),
              reference_std_mm=('precipitation_mm','std')))
    df = df.merge(reference,on=['LAT','LON','MONTH'],how='left',validate='many_to_one')
    df['rainfall_anomaly_mm'] = df.precipitation_mm - df.reference_2006_2024_mm
    df['rainfall_anomaly_pct'] = np.where(
        df.reference_2006_2024_mm > 0,
        100 * df.rainfall_anomaly_mm / df.reference_2006_2024_mm,
        np.nan)

    # Tam olarak 3 ardisik ay: baslangictaki 2 ay icin bos birak.
    groups = df.groupby(['LAT','LON'],sort=False)
    df['rainfall_3m_mm'] = groups['precipitation_mm'].transform(lambda x:x.rolling(3,min_periods=3).sum())
    df['rainfall_3m_reference_mm'] = groups['reference_2006_2024_mm'].transform(lambda x:x.rolling(3,min_periods=3).sum())
    df['rainfall_3m_anomaly_pct'] = np.where(
        df.rainfall_3m_reference_mm > 0,
        100*(df.rainfall_3m_mm-df.rainfall_3m_reference_mm)/df.rainfall_3m_reference_mm,
        np.nan)
    df['dry_month_flag_exploratory'] = np.where(df.rainfall_anomaly_pct.notna(), (df.rainfall_anomaly_pct <= -20).astype(int),np.nan)
    df['dry_3m_flag_exploratory'] = np.where(df.rainfall_3m_anomaly_pct.notna(),(df.rainfall_3m_anomaly_pct <= -20).astype(int),np.nan)
    df['reference_period'] = '2006-2024'
    df['date'] = df['date'].dt.strftime('%Y-%m')

    out_main = OUTPUT/'turkiye_iklim_analizi_2006_2025.csv'
    df.to_csv(out_main,index=False,encoding='utf-8-sig')
    clim = reference.sort_values(['LAT','LON','MONTH'])
    clim.to_csv(OUTPUT/'turkiye_aylik_yagis_referansi_2006_2024.csv',index=False,encoding='utf-8-sig')
    report2025 = df[df.YEAR==2025][['LAT','LON','YEAR','MONTH','date','precipitation_mm','reference_2006_2024_mm','rainfall_anomaly_mm','rainfall_anomaly_pct','rainfall_3m_mm','rainfall_3m_anomaly_pct']]
    report2025.to_csv(OUTPUT/'turkiye_2025_yagis_anomalileri.csv',index=False,encoding='utf-8-sig')

    npoints = len(coords)
    retained = df[['LAT','LON']].drop_duplicates().shape[0]
    print('Girdi grid noktasi:',npoints)
    print('Turkiye siniri icindeki grid noktasi:', retained)
    print('Turkiye disi grid noktasi:',npoints-retained)
    print('Cikti satirlari:',len(df))
    print('Aylik referans satirlari:',len(clim))
    print('2025 anomali satirlari:',len(report2025))
    print('3 aylik toplam bos satirlar:',df.rainfall_3m_mm.isna().sum())
    print('Olusturuldu:',out_main)
    print('Uyari: -%20 esigi sadece kesifsel; standart SPI kuraklik sinifi DEGILDIR.')
    print('Uyari: 2006-2024 referansi 30 yillik standart iklim normali DEGILDIR.')

if __name__=='__main__':
    main()
