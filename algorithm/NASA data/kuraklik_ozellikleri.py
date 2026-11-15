
import argparse
import csv
from collections import defaultdict
from datetime import date
from pathlib import Path
from statistics import mean

# ==========================================
# 1. DOSYA YOLLARI
# ==========================================

INPUT_FILE = Path(
    r"C:\Users\use\Desktop\kaptan_spaceApps\algorithm\NASA data\output\turkiye_nasa_power_monthly_2015_2025.csv"
)

OUTPUT_FILE = Path(
    r"C:\Users\use\Desktop\kaptan_spaceApps\algorithm\NASA data\output\turkiye_kuraklik_ozellikleri_2015_2025_output.csv"
)

# Referans dönemi
BASE_START = 2015
BASE_END = 2024


# ==========================================
# 2. YARDIMCI FONKSIYONLAR
# ==========================================

def number(value):
    if value is None or str(value).strip() in ("", "-999", "-999.0"):
        return None
    return float(value)


def rounded(value, digits=2):
    if value is None:
        return ""
    return round(value, digits)


# ==========================================
# 3. VERI OKUMA VE KONTROL
# ==========================================

def calculate(input_path, output_path):

    with open(input_path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    required = {
        "city", "year", "month",
        "precipitation_mm", "temperature_c",
        "rain_valid_days", "temp_valid_days",
        "expected_days"
    }

    if not rows:
        raise ValueError("CSV dosyasi bos!")

    missing = required - set(rows[0].keys())

    if missing:
        raise ValueError(f"Eksik sutunlar: {missing}")

    for row in rows:
        row["year"] = int(row["year"])
        row["month"] = int(row["month"])

        row["_date"] = date(
            row["year"], row["month"], 1
        )

        row["_rain"] = number(
            row["precipitation_mm"]
        )

        row["_temp"] = number(
            row["temperature_c"]
        )

        expected = int(row["expected_days"])

        row["_complete"] = (
            int(row["rain_valid_days"]) == expected
            and int(row["temp_valid_days"]) == expected
            and row["_rain"] is not None
            and row["_temp"] is not None
        )

        if row["_rain"] is not None and row["_rain"] < 0:
            raise ValueError(
                f"Negatif yagis verisi: {row['_date']}"
            )

    rows.sort(
        key=lambda r: (r["city"], r["_date"])
    )

    index = {
        (r["city"], r["_date"]): r
        for r in rows
    }

    if len(index) != len(rows):
        raise ValueError(
            "Tekrarlanan sehir-ay kaydi bulundu!"
        )

    # ======================================
    # 4. IKLIM REFERANS ORTALAMALARI
    # ======================================

    seasonal = defaultdict(list)

    for row in rows:
        if (
            BASE_START <= row["year"] <= BASE_END
            and row["_complete"]
        ):
            key = (row["city"], row["month"])
            seasonal[key].append(row)

    climate = {}

    for key, group in seasonal.items():
        if len(group) >= 8:
            climate[key] = (
                mean(r["_rain"] for r in group),
                mean(r["_temp"] for r in group),
                len(group)
            )

    # ======================================
    # 5. YENI OZELLIKLER
    # ======================================

    new_fields = [
        "year_month",
        "data_complete",
        "baseline_period",
        "baseline_year_count",
        "rainfall_climatology_mm",
        "rainfall_anomaly_mm",
        "rainfall_anomaly_pct_calc",
        "temperature_climatology_c",
        "temperature_anomaly_c",
        "rainfall_3m_mm",
        "rainfall_3m_baseline_mm",
        "rainfall_3m_anomaly_pct",
        "rainfall_3m_complete",
        "dry_month_flag_exploratory",
        "dry_3m_flag_exploratory"
    ]

    results = []

    for row in rows:

        city = row["city"]
        current_date = row["_date"]

        baseline = climate.get(
            (city, row["month"])
        )

        if baseline:
            base_rain, base_temp, count = baseline
        else:
            base_rain, base_temp, count = None, None, 0

        # Aylik yagis anomalisi
        rain_anomaly = None
        rain_pct = None
        temp_anomaly = None

        if row["_complete"] and baseline:

            rain_anomaly = row["_rain"] - base_rain

            if base_rain > 0:
                rain_pct = (
                    100 * rain_anomaly / base_rain
                )

            temp_anomaly = row["_temp"] - base_temp

        # ==================================
        # 6. SON 3 AYLIK YAGIS
        # ==================================

        month_index = (
            current_date.year * 12
            + current_date.month - 1
        )

        dates = [
            date(k // 12, k % 12 + 1, 1)
            for k in range(
                month_index - 2,
                month_index + 1
            )
        ]

        window = [
            index.get((city, d))
            for d in dates
        ]

        complete_3m = all(
            r is not None and r["_complete"]
            for r in window
        )

        rain_3m = None
        baseline_3m = None
        anomaly_3m = None

        if complete_3m:

            rain_3m = sum(
                r["_rain"] for r in window
            )

            if all(
                (city, d.month) in climate
                for d in dates
            ):

                baseline_3m = sum(
                    climate[(city, d.month)][0]
                    for d in dates
                )

                if baseline_3m > 0:
                    anomaly_3m = (
                        100 * (rain_3m - baseline_3m)
                        / baseline_3m
                    )

        # ==================================
        # 7. KURAKLIK ISARETLERI
        # ==================================

        dry_month = (
            int(rain_pct <= -20)
            if rain_pct is not None
            else ""
        )

        dry_3m = (
            int(anomaly_3m <= -20)
            if anomaly_3m is not None
            else ""
        )

        # ==================================
        # 8. CIKTI SATIRI
        # ==================================

        output = {
            k: v
            for k, v in row.items()
            if not k.startswith("_")
        }

        output.update({
            "year_month": current_date.strftime("%Y-%m"),
            "data_complete": int(row["_complete"]),
            "baseline_period": f"{BASE_START}-{BASE_END}",
            "baseline_year_count": count,
            "rainfall_climatology_mm": rounded(base_rain),
            "rainfall_anomaly_mm": rounded(rain_anomaly),
            "rainfall_anomaly_pct_calc": rounded(rain_pct),
            "temperature_climatology_c": rounded(base_temp),
            "temperature_anomaly_c": rounded(temp_anomaly),
            "rainfall_3m_mm": rounded(rain_3m),
            "rainfall_3m_baseline_mm": rounded(baseline_3m),
            "rainfall_3m_anomaly_pct": rounded(anomaly_3m),
            "rainfall_3m_complete": int(complete_3m),
            "dry_month_flag_exploratory": dry_month,
            "dry_3m_flag_exploratory": dry_3m
        })

        results.append(output)

    # ======================================
    # 9. CSV DOSYASINI KAYDET
    # ======================================

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    fieldnames = [
        k for k in rows[0]
        if not k.startswith("_")
    ] + new_fields

    with open(
        output_path,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=fieldnames
        )

        writer.writeheader()
        writer.writerows(results)

    print("Veri analizi tamamlandi!")
    print(f"Olusturulan dosya: {output_path}")
    print(f"Toplam satir: {len(results)}")
    print(
        "Not: Kuraklik isaretleri kesifsel analiz "
        "amaciyla olusturulmustur."
    )


# ==========================================
# 10. PROGRAMI CALISTIR
# ==========================================

if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--input",
        type=Path,
        default=INPUT_FILE
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_FILE
    )

    args = parser.parse_args()

    calculate(args.input, args.output)
