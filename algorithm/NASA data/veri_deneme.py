
import io
import calendar
from pathlib import Path

import pandas as pd
import requests

BASE_URL = "https://power.larc.nasa.gov/api/temporal/monthly/regional"

BASE_DIR = Path(__file__).resolve().parent

bolgeler = [
    {"ad": "Bati", "lon_min": 25.6, "lon_max": 35.0},
    {"ad": "Dogu", "lon_min": 35.0, "lon_max": 44.8},
]

parcalar = []

for bolge in bolgeler:

    params = {
        "parameters": "PRECTOTCORR",
        "community": "AG",
        "latitude-min": 35.8,
        "latitude-max": 42.1,
        "longitude-min": bolge["lon_min"],
        "longitude-max": bolge["lon_max"],
        "start": 2006,
        "end": 2025,
        "format": "CSV"
    }

    print(f"\n{bolge['ad']} Turkiye indiriliyor...")

    try:
        response = requests.get(
            BASE_URL,
            params=params,
            timeout=120
        )

        response.raise_for_status()

        lines = response.text.splitlines()

        # NASA CSV basligini bul
        start_idx = next(
            (
                i for i, line in enumerate(lines)
                if line.strip().upper().startswith(
                    "PARAMETER,YEAR,LAT,LON"
                )
            ),
            None
        )

        if start_idx is None:
            print("CSV basligi bulunamadi!")
            print(response.text[:1000])
            continue

        df = pd.read_csv(
            io.StringIO("\n".join(lines[start_idx:]))
        )

        print("Indirilen satir:", len(df))

        parcalar.append(df)

    except requests.RequestException as hata:
        print("Baglanti hatasi:", hata)


if not parcalar:
    raise RuntimeError("NASA verileri indirilemedi!")


# ==========================================
# VERILERI BIRLESTIR
# ==========================================

df = pd.concat(
    parcalar,
    ignore_index=True
)

# Ortak sinirdaki tekrar eden kayitlari temizle
df = df.drop_duplicates(
    subset=["PARAMETER", "YEAR", "LAT", "LON"]
)

df = df.sort_values(
    ["LAT", "LON", "YEAR"]
)

# Eksik NASA degerlerini temizle
aylar = [
    "JAN", "FEB", "MAR", "APR",
    "MAY", "JUN", "JUL", "AUG",
    "SEP", "OCT", "NOV", "DEC"
]

df[aylar] = df[aylar].replace(-999, float("nan"))


# ==========================================
# AYLIK FORMATINA DONUSTUR
# ==========================================

monthly = df.melt(
    id_vars=["PARAMETER", "YEAR", "LAT", "LON"],
    value_vars=aylar,
    var_name="MONTH_NAME",
    value_name="precipitation_mm_day"
)

month_map = {
    month: i + 1
    for i, month in enumerate(aylar)
}

monthly["MONTH"] = monthly["MONTH_NAME"].map(month_map)

# NASA aylik yagis degeri mm/gun birimindedir.
# Aylik toplam icin gun sayisi ile carpiyoruz.
monthly["days_in_month"] = monthly.apply(
    lambda row: calendar.monthrange(
        int(row["YEAR"]),
        int(row["MONTH"])
    )[1],
    axis=1
)

monthly["precipitation_mm"] = (
    monthly["precipitation_mm_day"]
    * monthly["days_in_month"]
)

monthly = monthly.sort_values(
    ["LAT", "LON", "YEAR", "MONTH"]
)

# ==========================================
# DOSYALARI KAYDET
# ==========================================

raw_path = BASE_DIR / "turkiye_2006_2025_yagis_grid.csv"

monthly_path = (
    BASE_DIR / "turkiye_2006_2025_yagis_monthly.csv"
)

df.to_csv(
    raw_path,
    index=False,
    encoding="utf-8-sig"
)

monthly.to_csv(
    monthly_path,
    index=False,
    encoding="utf-8-sig"
)

print("\nNASA VERILERI BASARIYLA HAZIRLANDI!")
print("Grid-yil kayitlari:", len(df))
print("Aylik kayitlar:", len(monthly))
print("Grid noktasi sayisi:",
      df[["LAT", "LON"]].drop_duplicates().shape[0])

print("\nOlusturulan dosyalar:")
print(raw_path)
print(monthly_path)
