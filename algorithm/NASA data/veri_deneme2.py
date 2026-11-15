import io
import time
import pandas as pd
import requests

# NASA POWER regional CSV kuralları:
# 1) Maksimum 10°x10° alan (Batı & Doğu Türkiye)
# 2) Tek istekte en fazla 10 yıl
# 3) CSV formatında tek istekte en fazla 1 parametre

bolgeler = [
    {"ad": "Bati_Turkiye", "lon_min": 25.6, "lon_max": 35.0},
    {"ad": "Dogu_Turkiye", "lon_min": 35.0, "lon_max": 44.8},
]

donemler = [
    {"start": "2006", "end": "2015"},
    {"start": "2016", "end": "2025"},  # Monthly regional tamamlanmış yılları ister
]

parametreler = [
    "PRECTOTCORR",
    "T2M",
    "GWETTOP",
    "GWETROOT",
]  # Her biri tek tek çekilecek

parcalar = []

for param in parametreler:
    for b in bolgeler:
        for d in donemler:
            url = "https://power.larc.nasa.gov/api/temporal/monthly/regional"
            params = {
                "parameters": param,  # Tek parametre
                "community": "AG",
                "latitude-min": 35.8,
                "latitude-max": 42.1,
                "longitude-min": b["lon_min"],
                "longitude-max": b["lon_max"],
                "start": d["start"],
                "end": d["end"],
                "format": "CSV",
            }

            print(f"Çekiliyor: {param} | {b['ad']} ({d['start']}-{d['end']})...")
            r = requests.get(url, params=params, timeout=120)

            if r.status_code != 200:
                print(f"Hata ({r.status_code}):", r.text)
                continue

            # Üstteki NASA meta-veri başlıklarını atla
            lines = r.text.splitlines()
            start_idx = next(
                (
                    i
                    for i, line in enumerate(lines)
                    if line.startswith("PARAMETER") or line.startswith("LAT")
                ),
                0,
            )

            df_part = pd.read_csv(io.StringIO("\n".join(lines[start_idx:])))
            # Eğer CSV'de PARAMETER sütunu yoksa biz ekleyelim
            if "PARAMETER" not in df_part.columns:
                df_part.insert(0, "PARAMETER", param)

            parcalar.append(df_part)
            time.sleep(1)  # Sunucuyu yormamak için 1 saniye bekleme

if parcalar:
    turkiye_df = pd.concat(parcalar, ignore_index=True).drop_duplicates()
    turkiye_df.replace(-999.0, pd.NA, inplace=True)

    dosya_adi = "turkiye_20_yillik_iklim_ve_toprak_nemi.csv"
    turkiye_df.to_csv(dosya_adi, index=False)
    print(
        f"\nBaşarılı! '{dosya_adi}' kaydedildi. Toplam satır: {len(turkiye_df)}"
    )
    print(turkiye_df.head())
else:
    print("Veri çekilemedi.")