# NASA Smart Farming — tahmin entegrasyonu

14 Kasım 2026

`POST http://localhost:5000/predict` korunmuştur. Dokuz aylık sıcaklık tahmini
`monthlyForecasts` alanında sunulur. Gerçek yağış tahmini bulunamadığından yağış
alanları `null` kalır. Rotasyon puanlama formülü değiştirilmemiştir.

## Değiştirilen ve eklenen dosyalar

- `forecast_integration.py`: kaynak CSV/NetCDF okuma, sınır filtresi, birim/zaman
  doğrulaması, mekânsal eşleştirme ve 2006–2025 aylık referansları.
- `decision_engine.py`: eski tek aylık ara CSV yerine kaynak entegrasyonu;
  aylık tahminler, değişken başına kaynak/başlangıç/grid/ensemble bilgisi,
  eksik veriler için `null`, ayrı geçmiş referansları ve kalibrasyonsuz farklar.
- `api.py`: aynı endpoint ve istek şeması; açıklama ve sürüm 0.5.0.
- `tests/test_decision_engine.py`: artık desteklenen Ocak 2027 yerine
  kapsam dışındaki Ağustos 2027 ile bilinmeyen ay testi.
- `tests/test_forecast_integration.py`, `tests/conftest.py`: entegrasyon testleri.
- `requirements-forecast.txt`: çalıştırma/test bağımlılıkları.
- Bu rapor ve `output/forecast_integration/` altındaki yeni çıktılar.

Testler için depo kökünde `.venv` oluşturulup bağımlılıklar buraya kuruldu.

`rotation_engine.py`, ürün kataloğu, mevcut veri CSV'leri, arayüz ve indirme/eğitim
kodlarına yazılmamıştır. Önceden var olan `algorithm/deneme.py` silinmiş Git
durumuna müdahale edilmemiştir. Eski ara çıktılar üzerine yazılmamıştır.

## Yeni fonksiyonlar

`forecast_integration.py`:

- `turkey_points`: mevcut Natural Earth Türkiye geometrisinde `covers` filtresi.
- `convert_values`: Kelvin–Celsius ve açık birime göre aylık yağış dönüşümü.
- `read_temperature_csv`: sütun, tarih, lead, koordinat ve tekrar kontrolü.
- `read_netcdf`: gerçek değişkenleri ve zaman değerlerini/offsetlerini okuma.
- `read_rainfall_csv`: açık tahmin tarihi, birim ve ensemble bilgili yağış CSV'si.
- `historical_baseline`: 2006–2025 aylık ortalama ve geçerli yıl sayıları.
- `build_forecasts`: değişken ve ay bazında tahmin bağlamı ile kalite raporu.

Mevcut `nearest`, `read_variable` ve `main` güncellendi.
`decision_engine.py` içine `optional_text` ve `monthly_forecasts` eklendi.

## İncelenen NASA dosyaları ve kapsam

| Dosya | İçerik / kullanım |
|---|---|
| `turkiye_tahmin_sicaklik_yagis_9ay.csv` | 4.446 kayıt, 494 nokta; yalnızca `T2M`, Kelvin; ana sıcaklık kaynağı |
| `turkiye_geos_s2s_9aylik_tahmin.csv` | 988 kayıt; Kasım–Aralık 2026 için yalnızca `T2M`; yağış değildir, ana sıcaklık serisine karıştırılmaz |
| `data/20261003.at.ens1.lead1.nc4` | Yalnızca `T2M`, Kelvin; incelendi, dokuz aylık CSV öncelikli |
| `data/20261028.wet3.ens1.lead1.nc4` | Kasım 2026 `WET3`, boyutsuz; toprak nemi kaynağı |
| `turkiye_birlesik_iklim_2006_2025.csv` | 63.600 kayıt, 265 POWER noktası; aylık sıcaklık/yağış referansları |
| `data/2025_kasim_tarihsel_stres.csv` | Önceden kullanılan Kasım 2025 betimleyici stres bağlamı korunur |
| `temp_ay_8.nc4` | 0 bayt, okunamaz; kalite raporunda uyarı |

Projedeki CSV başlıkları ve NetCDF değişkenleri tarandı; iki aylık gerçek yağış
tahmini bulunamadı. Ayrıntılı dosya envanteri `output/forecast_integration/quality_report.json`
içindedir. Geçmiş yağış CSV'leri geleceğe ait tahmin olarak alınmaz.

| Geçerli ay | Sıcaklık | Yağış | WET3 |
|---|---|---|---|
| 2026-11 | Var | Eksik (`null`) | Var |
| 2026-12 | Var | Eksik (`null`) | Eksik (`null`) |
| 2027-01 | Var | Eksik (`null`) | Eksik (`null`) |
| 2027-02 | Var | Eksik (`null`) | Eksik (`null`) |
| 2027-03 | Var | Eksik (`null`) | Eksik (`null`) |
| 2027-04 | Var | Eksik (`null`) | Eksik (`null`) |
| 2027-05 | Var | Eksik (`null`) | Eksik (`null`) |
| 2027-06 | Var | Eksik (`null`) | Eksik (`null`) |
| 2027-07 | Var | Eksik (`null`) | Eksik (`null`) |

Sıcaklık başlangıcı **2026-10-23**, WET3 başlangıcı **2026-10-28** olarak
ayrı saklanır. Ana CSV, tüm aylar için aynı başlangıç serisini korumak amacıyla
diğer kısa sıcaklık dosyalarına göre önceliklidir.

Natural Earth filtresi 330 sıcaklık noktasını / 2.970 kaydı korudu;
164 nokta / 1.476 kayıt sınır dışında kaldı. Kaynak sıcaklık CSV'sinde tekrar,
eksik sıcaklık veya eksik aylı nokta yok. Bu filtre kaba kıyı/sınır geometrisidir.
GEOS noktaları POWER gridine en yakın komşuyla eşleştirilir; enlemle ölçeklenmiş
uzaklık 0,75 dereceyi aşarsa tahmin değeri eksik bırakılır. Kaynak ve referans
koordinatları ayrı döner; bu yöntem yanlılık veya yükseklik düzeltmesi değildir.

CSV'de ensemble sütunu bulunmaz. `veri_deneme3.py` dosyasının `.at.ens1.lead`
seçimi tek üye kökenini gösterir; bu kanıt API'de açıkça belirtilir. WET3 üyesi
NetCDF dosya adından doğrulanır. Ensemble ortalaması/güven aralığı üretilmez.

## API örnekleri

Tam yanıtlar: `output/forecast_integration/ankara_predict.json` ve
`output/forecast_integration/konya_predict.json`. İstek gövdeleri aynı klasörde
`ankara_request.json` ve `konya_request.json`; kurak senaryo yanıtları
`ankara_dry_scenario.json` ve `konya_dry_scenario.json` dosyalarındadır.

Ankara yanıtındaki ilk aylık kaydın kısaltılmış görünümü:

```json
{
  "month": "2026-11",
  "temperatureC": 4.344,
  "precipitationMm": null,
  "soilWetnessWet3Index": 0.4227,
  "historicalBaseline": {
    "referencePeriod": "2006-2025",
    "temperatureC": 5.732,
    "precipitationMm": 29.265
  },
  "temperatureDifferenceCUnadjusted": -1.389,
  "precipitationDifferencePctUnadjusted": null,
  "forecastSource": "NASA GEOS-S2S",
  "forecastRunDate": "2026-10-23"
}
```

`location`, `historicalClimate`, `forecast`, `historicalStressContext`,
`scenarioAnalysis`, `rotationStrategies` ve önceki diğer yanıt alanları korunur.
`climateSummary`, `farmerInputs`, `scenario`, `monthlyForecasts`, `forecastCoverage`
eklenmiştir. Tahmin değerleri rotasyon puanlarına yeni bir ağırlık eklemez.
Senaryoda tahmini aylık yağış varsa kullanıcı yüzdesi buna uygulanır; yoksa
sonuç `null` kalır. Sıcaklık senaryosu da ayrı, varsayımsal değer olarak sunulur.

## Doğrulama sonuçları

Komut (depo kökünden):

```powershell
& '.venv/Scripts/python.exe' -m pytest 'algorithm/NASA data/tests' -q
```

- 20 test başarılı, başarısız test yok.
- Gerçek dokuz aylık CSV okuma, Kelvin dönüşümü, tarih/lead/koordinat kontrolleri,
  tekrar reddi, Türkiye poligon filtresi ve eksik değer davranışı doğrulandı.
- Ankara ve Konya için dokuzar aylık TestClient POST isteği geçerli JSON döndü;
  ay kapsamı, üç rotasyon ve eksik yağış/toprak nemi `null` değerleri doğrulandı.
- Ayrıca geçici Uvicorn sunucusuyla gerçek `http://localhost:5000/predict`
  adresine Ankara/Konya istekleri HTTP 200 döndü. Sunucu test sonunda kapatıldı.
- Önceki rotasyon puanları `[35, 54, 54]`; kurak senaryo puanları `[32, 51, 51]`
  ve senaryo baskı indeksi `68.9` korunuyor. `rotation_engine.assess_rotation`
  ayrıca çalıştırıldı ve üç strateji döndürdü.
- Referans ortalamaları gerçek 2006–2025 kayıtlarıyla karşılaştırıldı.
- Yağış akısının `kg m-2 s-1` → mm/ay dönüşümü, NetCDF zaman offsetleri,
  Kasım/Aralık eşleştirmesi, artık yıl ve diğer aylarda `null` davranışı
  **yalnızca geçici, yapay birim testi girdileriyle** doğrulandı. Bu girdiler
  NASA verisi veya örnek API yanıtı olarak kaydedilmedi/kullanılmadı.
- Gerçek yağış dosyasının entegrasyon doğrulaması **yapılamadı: dosya eksik**.
- Test ortamındaki Starlette/httpx kullanımı bir kullanımdan kaldırma uyarısı
  veriyor; testler ve gerçek HTTP istekleri geçiyor.

## Sınırlamalar ve gereken ek veri

İki aylık gerçek yağış CSV/NetCDF dosyası, değişken adı, birim, başlangıç tarihi,
geçerlilik zamanı ve ensemble bilgisiyle sağlanmalıdır. Boş `temp_ay_8.nc4`
dosyası gerekiyorsa yeniden edinilmelidir. Yeni kaynak eklendikten sonra API
süreci yeniden başlatılmalıdır; okuma mevcut önbellekle korunur.

Okuyucu, aylık ortalama yağış akılarında geçerli ayın gün/saniye sayısını kullanır;
bilinmeyen birimleri reddeder. Desteklenen CSV yağış şeması `time`, `lat`, `lon`,
`baslangic_tarihi` (YYYYMMDD), gerçek yağış değişkeni, `units`, `ensemble_member`
alanlarını gerektirir. NetCDF okuyucu gerçek değişken/birim/zaman meta verisini
kullanır; aylık GEOS dosyalarının boyutu `time,lat,lon` olmalıdır. Yeni ürünlerin
zamansal ortalama/toplam tanımı ayrıca doğrulanmalıdır.

GEOS-S2S–POWER farkları kalibrasyonsuz kaynaklar arası karşılaştırmadır;
kalibre anomali, kesin risk veya ürün verimi değildir. WET3, POWER GWETROOT ile
doğrudan anomali hesabına sokulmaz. Aylık referanslar artık 2006–2025 kullanır;
korunan Kasım 2025 stres bağlamı eski 2006–2024 referansına dayanır.

Depo kökünden API başlatma:

```powershell
& '.venv/Scripts/python.exe' -m uvicorn api:app --app-dir 'algorithm/NASA data' --host 127.0.0.1 --port 5000
```

Başka bir ortamda bağımlılık kurulumu: `pip install -r requirements-forecast.txt`.
API klasöründe entegrasyon çıktıları: `python forecast_integration.py`.
