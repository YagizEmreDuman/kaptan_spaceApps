"""NASA POWER'dan 7 Türkiye il merkezi için günlük veri çekip aylık CSV üretir.
Çalıştırma: pip install -r requirements.txt && python nasa_power_turkiye.py
Gerçek API çağrısı yapar; simüle/veri uydurma yoktur.
"""
from pathlib import Path
import time
import requests
import pandas as pd

START = "20150101"
END = "20251231"
OUT = Path(__file__).parent / "output"
OUT.mkdir(exist_ok=True)

# Noktalar il merkezi koordinatlarıdır; il ortalamaları değildir.
CITIES = {
    "Ankara": (39.9334, 32.8597),
    "Konya": (37.8746, 32.4932),
    "Istanbul": (41.0082, 28.9784),
    "Izmir": (38.4237, 27.1428),
    "Antalya": (36.8969, 30.7133),
    "Erzurum": (39.9043, 41.2679),
    "Sanliurfa": (37.1674, 38.7955),
}
URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def fetch_city(city: str, lat: float, lon: float) -> pd.DataFrame:
    params = {
        "parameters": "PRECTOTCORR,T2M",
        "community": "AG",
        "latitude": lat,
        "longitude": lon,
        "start": START,
        "end": END,
        "format": "JSON",
        "time-standard": "UTC",
    }
    response = requests.get(URL, params=params, timeout=90)
    response.raise_for_status()
    payload = response.json()
    values = payload["properties"]["parameter"]
    rain = values["PRECTOTCORR"]  # mm/gün
    temp = values["T2M"]  # °C

    df = pd.DataFrame({
        "date": pd.to_datetime(list(rain.keys()), format="%Y%m%d"),
        "precipitation_mm_day": list(rain.values()),
    })
    df["temperature_c_day"] = df["date"].dt.strftime("%Y%m%d").map(temp)
    for col in ["precipitation_mm_day", "temperature_c_day"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df.loc[df[col] <= -900, col] = float("nan")  # NASA eksik veri kodu -999
    df["city"] = city
    df["latitude"] = lat
    df["longitude"] = lon
    df["data_source"] = "NASA POWER"
    return df


def to_monthly(daily: pd.DataFrame) -> pd.DataFrame:
    records = []
    for (city, year, month), g in daily.groupby([
        "city", daily["date"].dt.year.rename("year"),
        daily["date"].dt.month.rename("month")
    ], sort=True):
        expected = (pd.Timestamp(year, month, 1) + pd.offsets.MonthEnd(0)).day
        rain_ok = g["precipitation_mm_day"].notna().sum()
        t_ok = g["temperature_c_day"].notna().sum()
        records.append({
            "city": city,
            "year": year,
            "month": month,
            "latitude": g["latitude"].iloc[0],
            "longitude": g["longitude"].iloc[0],
            "precipitation_mm": g["precipitation_mm_day"].sum() if rain_ok == expected else float("nan"),
            "temperature_c": g["temperature_c_day"].mean() if t_ok == expected else float("nan"),
            "rain_valid_days": int(rain_ok),
            "temp_valid_days": int(t_ok),
            "expected_days": expected,
            "data_source": "NASA POWER",
        })
    monthly = pd.DataFrame(records).sort_values(["city", "year", "month"])
    # Basit referans dönemi: 2015–2024. Uzun dönem klimatolojik normal değildir.
    baseline = (monthly[monthly["year"].between(2015, 2024)]
        .groupby(["city", "month"])["precipitation_mm"].mean()
        .rename("rainfall_baseline_mm").reset_index())
    monthly = monthly.merge(baseline, on=["city", "month"], how="left")
    monthly["rainfall_anomaly_pct"] = (
        (monthly["precipitation_mm"] - monthly["rainfall_baseline_mm"])
        / monthly["rainfall_baseline_mm"].replace(0, float("nan")) * 100
    ).round(2)
    return monthly


def main():
    frames = []
    for city, (lat, lon) in CITIES.items():
        print(f"NASA POWER: {city} verisi çekiliyor...")
        try:
            frames.append(fetch_city(city, lat, lon))
        except (requests.RequestException, KeyError, ValueError) as exc:
            print(f"HATA: {city}: {exc}")
            continue
        time.sleep(1)  # API'ye aşırı istek göndermeyelim
    if not frames:
        raise RuntimeError("Hiçbir NASA isteği tamamlanamadı. İnternet / API erişimini kontrol edin.")
    daily = pd.concat(frames, ignore_index=True)
    monthly = to_monthly(daily)
    daily.to_csv(OUT / "turkiye_nasa_power_daily_2015_2025.csv", index=False, encoding="utf-8-sig")
    monthly.to_csv(OUT / "turkiye_nasa_power_monthly_2015_2025.csv", index=False, encoding="utf-8-sig")
    print(f"Tamamlandı: {len(daily)} günlük satır, {len(monthly)} aylık satır")
    print(f"Dosyalar: {OUT.resolve()}")
    if len(frames) != len(CITIES):
        print("UYARI: Bazı şehirler alınamadı; eksik bölgeleri kontrol edin.")

if __name__ == "__main__":
    main()
