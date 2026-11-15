"""NASA Smart Farming | G8: açıklanabilir, KEŞİFSEL tarımsal iklim risk göstergeleri.

Girdi: Görev 7 birleşik iklim CSV (2006–2025, Türkiye içine düşen ızgara noktaları).
Çıktı: tüm aylar için göstergeler ve 2025 odaklı özet.

UYARI: Bunlar doğrulanmış kuraklık / ürün uygunluğu sınıfları DEĞİLDİR.
2006-2024 referansı aynı dönemin satırlarını içerir; tarihsel risk skorları
bağımsız (out-of-sample) doğrulama değildir. Tahmin bilgisi kullanılmaz.
"""
from pathlib import Path
import argparse
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = BASE_DIR / 'turkiye_birlesik_iklim_2006_2025.csv'


def bounded(x):
    return np.clip(x, 0, 1)


def build(input_csv: Path, outdir: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    df = pd.read_csv(input_csv)
    req = {'LAT','LON','YEAR','MONTH','precipitation_mm', 'precipitation_anomaly_pct',
           'precipitation_3m_anomaly_pct','temperature_c_anomaly',
           'soil_wetness_root_anomaly','soil_wetness_root_reference_std',
           'soil_wetness_top_anomaly','soil_wetness_top_reference_std'}
    missing = req - set(df.columns)
    if missing:
        raise ValueError(f'Eksik sütunlar: {sorted(missing)}')
    keys = ['LAT', 'LON', 'YEAR', 'MONTH']
    if df.duplicated(keys).any():
        raise ValueError('Tekrarlanan koordinat-yıl-ay kaydı bulundu')
    df = df.sort_values(keys).copy()
    if not df['YEAR'].between(2006, 2025).all() or not df['MONTH'].between(1,12).all():
        raise ValueError('Beklenmeyen yıl veya ay')

    # Yağış açığı: pozitif değerler yağış eksiğini gösterir.
    # -%40 ve daha büyük açıklar, sadece prototipte 1'e doyurulur.
    df['rain_shortfall_ratio'] = bounded(-df['precipitation_anomaly_pct'] / 40)
    df['rain_3m_shortfall_ratio'] = bounded(-df['precipitation_3m_anomaly_pct'] / 40)
    # Kök bölgesi ıslaklığı, MERRA-2'nin BOYUTSUZ model endeksidir.
    # Sıfır veya sıfıra yakın referans std varsa standartlaştırma yapılmaz.
    root_sd = df['soil_wetness_root_reference_std'].where(df['soil_wetness_root_reference_std'] >= 0.02)
    top_sd = df['soil_wetness_top_reference_std'].where(df['soil_wetness_top_reference_std'] >= 0.02)
    df['root_wetness_z'] = df['soil_wetness_root_anomaly'] / root_sd
    df['top_wetness_z'] = df['soil_wetness_top_anomaly'] / top_sd
    df['root_dryness_ratio'] = bounded(-df['root_wetness_z'] / 2)
    df['top_dryness_ratio'] = bounded(-df['top_wetness_z'] / 2)
    # Sıcaklık anomalisi 0..+4 °C aralığında 0..1'e normalize edilir.
    # Mutlak ürün ısı stresi eşiği DEĞİLDİR.
    df['warm_anomaly_ratio'] = bounded(df['temperature_c_anomaly'] / 4)

    # Her satır için mevcut bileşenleri kullanarak ağırlıkları yeniden normalize et.
    # Nem yoksa skor daha düşük güven / eksik bileşen notuyla hesaplanır.
    components = {'rain_shortfall_ratio':0.25, 'rain_3m_shortfall_ratio':0.30,
                  'root_dryness_ratio':0.30, 'warm_anomaly_ratio':0.15}
    numerator = pd.Series(0.0,index=df.index)
    denominator = pd.Series(0.0,index=df.index)
    for col, w in components.items():
        valid = df[col].notna()
        numerator += df[col].fillna(0) * w
        denominator += valid.astype(float) * w
    df['risk_component_coverage'] = denominator
    df['climate_stress_score_0_100'] = (100 * numerator / denominator.where(denominator>0)).round(1)
    df['risk_indicator_band'] = pd.cut(df['climate_stress_score_0_100'],
        bins=[-0.01,25,50,75,100.001],labels=['dusuk_gosterge','orta_gosterge','yuksek_gosterge','cok_yuksek_gosterge'],include_lowest=True)
    df['risk_scope'] = 'kesifsel_iklim_stresi_urun_bazli_degil'
    df['reference_period'] = '2006-2024'
    df['is_forecast'] = False

    outdir.mkdir(parents=True,exist_ok=True)
    allpath = outdir / 'turkiye_iklim_risk_gostergeleri_2006_2025.csv'
    df.to_csv(allpath,index=False,encoding='utf-8-sig',float_format='%.5f')
    y2025 = df.loc[df['YEAR']==2025].copy()
    y2025.to_csv(outdir / 'turkiye_2025_iklim_risk_gostergeleri.csv',index=False,encoding='utf-8-sig',float_format='%.5f')
    monthly = y2025.groupby('MONTH',as_index=False).agg(
        grid_points=('LAT','size'),
        average_rainfall_mm=('precipitation_mm','mean'),
        average_rainfall_anomaly_pct=('precipitation_anomaly_pct','mean'),
        average_temperature_anomaly_c=('temperature_c_anomaly','mean'),
        average_climate_stress_score=('climate_stress_score_0_100','mean'),
        mean_component_coverage=('risk_component_coverage','mean'))
    monthly.to_csv(outdir / '2025_aylik_izgara_ozeti.csv',index=False,encoding='utf-8-sig',float_format='%.3f')
    print(f'Tamamlandı: {len(df):,} aylık satır; {df[["LAT","LON"]].drop_duplicates().shape[0]} grid noktası')
    print(f'3 aylık yağış göstergesi eksik: {df["rain_3m_shortfall_ratio"].isna().sum()} satır (ilk 2 ay / nokta)')
    print('UYARI: Skorlar KEŞİFSEL, kalibre edilmiş kuraklık olasılığı veya tarımsal karar değildir.')
    return df, monthly


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--input',type=Path,default=DEFAULT_INPUT)
    parser.add_argument('--output-dir',type=Path,default=BASE_DIR/'output')
    args=parser.parse_args()
    build(args.input,args.output_dir)
