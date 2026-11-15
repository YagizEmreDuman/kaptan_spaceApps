from collections import Counter
import os
import re
from bs4 import BeautifulSoup
import pandas as pd
import requests
import xarray as xr

base_url = (
    "https://portal.nccs.nasa.gov/datashare/gmao/geos-s2s-3/NRT/NMME/monthly/nov2026/"
)

print("Dizin taranıyor...")
resp = requests.get(base_url, timeout=30)
soup = BeautifulSoup(resp.text, "html.parser")

all_nc = [
    a["href"] for a in soup.find_all("a", href=True) if a["href"].endswith(".nc4")
]

# 1. En az 4 aylık (lead1..lead4+) tahmini tamamlanmış EN GÜNCEL başlangıç tarihini bul
at_ens1_files = [f for f in all_nc if ".at.ens1.lead" in f]
tarih_sayilari = Counter(re.findall(r"^(\d{8})\.", f)[0] for f in at_ens1_files)

# En az 4 ayı tamamlanmış tarihleri filtrele ve en yenisini seç
tamamlanmis_tarihler = sorted(
    [t for t, adet in tarih_sayilari.items() if adet >= 4]
)
secilen_tarih = tamamlanmis_tarihler[-1]
print(
    f"Seçilen tam tahmin tarihi: {secilen_tarih} ({tarih_sayilari[secilen_tarih]} aylık tahmin mevcut)"
)

# 2. Hem Atmosfer (.at. -> Sıcaklık & Yağış) hem Arazi (.ld. -> Toprak Nemi) dosyalarını al
at_files = sorted(
    [f for f in all_nc if f.startswith(f"{secilen_tarih}.at.ens1.lead")]
)
ld_files = sorted(
    [f for f in all_nc if f.startswith(f"{secilen_tarih}.ld.ens1.lead")]
)

print(
    f"Bulunan Atmosfer (Sıcaklık/Yağış) dosyası: {len(at_files)} | Toprak Nemi (.ld) dosyası: {len(ld_files)}"
)


def indir_ve_kes(dosya_listesi, etiket):
    parcalar = []
    for idx, fname in enumerate(dosya_listesi, 1):
        url = base_url + fname
        local_nc = f"temp_{etiket}_{idx}.nc4"
        print(f"[{etiket} {idx}/{len(dosya_listesi)}] İndiriliyor: {fname} ...")

        with requests.get(url, stream=True, timeout=60) as r:
            r.raise_for_status()
            with open(local_nc, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)

        ds = xr.open_dataset(local_nc)
        lat_name = "lat" if "lat" in ds.coords else "Y"
        lon_name = "lon" if "lon" in ds.coords else "X"

        turkiye_ds = ds.sel(
            {lat_name: slice(35.8, 42.1), lon_name: slice(25.6, 44.8)}
        )
        df = turkiye_ds.to_dataframe().reset_index()

        # Lead (kaçıncı ay tahmini olduğu) bilgisini ekle
        lead_match = re.search(r"lead(\d+)", fname)
        df["lead_ay"] = int(lead_match.group(1)) if lead_match else idx
        df["baslangic_tarihi"] = secilen_tarih

        parcalar.append(df)
        ds.close()
        os.remove(local_nc)

    return pd.concat(parcalar, ignore_index=True) if parcalar else pd.DataFrame()


# 3. Verileri çek ve kaydet
df_at = indir_ve_kes(at_files, "Atmosfer")
df_at.to_csv("turkiye_tahmin_sicaklik_yagis_9ay.csv", index=False)
print(
    "\nAtmosfer sütunları (Sıcaklık ve Yağış):",
    [c for c in df_at.columns if c not in ["lat", "lon", "time"]],
)

if ld_files:
    df_ld = indir_ve_kes(ld_files, "ToprakNemi")
    df_ld.to_csv("turkiye_tahmin_toprak_nemi_9ay.csv", index=False)
    print(
        "Toprak Nemi sütunları:",
        [c for c in df_ld.columns if c not in ["lat", "lon", "time"]],
    )

print("\nTAMAMLANDI! Artık 4-9 aylık sıcaklık, yağış ve toprak nemi tahminlerin hazır.")