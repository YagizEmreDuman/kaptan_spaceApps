# Dinamik veri bağlantısı

Frontend, iklim ve rotasyon sonuçlarını `frontend → Node API → algorithm/FastAPI`
akışından alır. Tarayıcıda iklim/rotasyon modeli veya örnek hava durumu verisi
çalıştırılmaz. Arayüz etiketleri, çeviriler ve kullanıcı formunun seçenekleri
ölçüm/tahmin olarak sunulmaz.

## Çalıştırma

Depo kökünde bir PowerShell terminali:

```powershell
& '.venv/Scripts/python.exe' -m uvicorn api:app --app-dir 'algorithm/NASA data' --host 127.0.0.1 --port 5000
```

İkinci terminalde:

```powershell
cd backend
npm start
```

Site: **http://localhost:3000/**. Backend sağlık kontrolü: `/api/health`.
3000 portunda eski backend çalışıyorsa güncel kodu kullanmak için o süreç
yeniden başlatılmalıdır. Alternatif olarak ikinci terminalde:

```powershell
$env:PORT='3107'
npm start
```

Bu durumda site **http://localhost:3107/** adresindedir. `/api/config.js`,
frontend'in API adresini aynı sunucuya bağlar. Ayrı bir statik sunucuyla açıldığında
varsayılan API `http://localhost:3000/api` olur; gerekirse modüller yüklenmeden
`globalThis.CROPGUARD_API_BASE_URL` ayarlanabilir. Python adresi backend'deki
`ALGORITHM_URL` ortam değişkeniyle değiştirilebilir.

## Ekranların kaynakları

| Alan | Kaynak / davranış |
|---|---|
| Ürün seçenekleri | FastAPI `GET /catalog`, gerçek `urun_katalogu.csv` |
| Analiz ayları | `/catalog.forecastMonths`, mevcut kaynak dosyalarının kapsamı |
| Sıcaklık, yağış, WET3 | `/predict.monthlyForecasts`, eksikler `null`/`—` |
| Geçmiş aylık ortalamalar | `historicalBaseline`, NASA POWER 2006–2025 |
| Rotasyon kartları ve ürün sıraları | `/predict.rotationStrategies` |
| Sezgisel puanlar ve açıklamalar | Algorithm çıktısı aynen gösterilir |
| Senaryo | Algorithm'in `scenarioAnalysis` çıktısı; kullanıcı varsayımı olarak etiketlidir |
| Günlük hava | Mevcut [Open-Meteo canlı servisi](https://open-meteo.com/en/docs), Node `/api/weather-tasks` üzerinden |
| Saha bildirimleri | Yalnızca servisten gelen gerçek tarihli hava kayıtlarından üretilen bildirimler |

Algorithm'de günlük hava tahmini bulunmadığı için aylık GEOS-S2S verilerinden
günlük tahmin üretilmez. Günlük servis başarısızsa bu bölüm eksik veri mesajı
gösterir; aylık veri ve rotasyonlar çalışmaya devam eder. Günlük değerler
servisin döndürdüğü tarihlerle gösterilir; 14 günden 30 güne uzatılmaz.
`rainMm`, sıfır sıcaklık ve eksik rüzgâr/nem alanları doğru biçimde korunur.

Önceki sabit bölgesel iklim tabloları, yerel risk/getiri hesaplamaları, ek kazanç,
verim artışı, su tasarrufu yüzdeleri ve sabit ekim/hasat takvimleri kaldırıldı.
Motor bunları sağlamadığı için gerçek sonuç gibi gösterilmez. Risk grafiği
yerine gerçek GEOS-S2S–POWER sıcaklık farkı gösterilir ve kalibrasyonsuz olduğu
belirtilir. Ayrıntıda mevcut tarihsel stres bağlamı ve model sınırlamaları yer alır.

Senaryoda desteklenen alan adları `rainfallChangePct`, `temperatureChangeC`,
`irrigationAvailabilityChangePct`; ürünler katalogdaki `wheat`, `barley`,
`chickpea`, `lentil`, `sunflower`, `maize` kimlikleriyle gönderilir. Tek ana ürün
girdisi mevcut rotasyon için iki kez kullanılır. Toprak, alan, bütçe ve makine
girdileri korunur; motorun bunlar için ek puan üretmediği ekranda açıklanır.

Mevcut kaynaklarda sıcaklık Kasım 2026–Temmuz 2027 arasında bulunur. Gerçek
yağış tahmin dosyası eksiktir; tüm aylarda boş kalır. WET3 yalnızca Kasım 2026
için vardır. Türkiye kapsamı dışındaki algorithm istekleri hata mesajıyla
gösterilir; en yakın Türkiye noktasının verisi başka ülkeye aitmiş gibi sunulmaz.

## Doğrulama

Depo kökünden:

```powershell
node --test frontend/tests/dynamicData.test.js backend/tests/api.test.js
& '.venv/Scripts/python.exe' -m pytest 'algorithm/NASA data/tests' -q
```

- 12 frontend veri/HTML çıktı/grafik sözleşmesi testi başarılı.
- 6 Node proxy/statik dosya/hata davranışı testi başarılı.
- 21 algorithm testi başarılı; bunlardan biri yeni `/catalog` sözleşmesini doğrular.
- Gerçek Python ve Node süreçleriyle, frontend'in gerçek API istemcisi üzerinden
  Ankara ve Konya analizleri ve Ocak 2027 senaryoları başarıyla çalıştırıldı.
  İzole testte 3107 portu kullanıldı; mevcut 3000 sürecine müdahale edilmedi.
- Bu izole testte sandbox günlük servisin ağ erişimini engelledi; aylık veriler
  çalışırken günlük bölüm boş kaldı. Ayrıca ağ izniyle doğrudan gerçek
  Open-Meteo servisi test edildi: Ankara için 14 gün ve gerçek yağış/rüzgâr
  değerleri döndü. Aylık yağış eksikliği bu günlük servisle doldurulmaz.
- Görsel tarayıcı testi yapılmadı. Frontend testleri DOM çıktılarını ve Chart
  yapılandırmasını denetler; tarayıcı yerleşimi için başarı iddiası yoktur.
- Python test ortamında önceden bulunan Starlette/httpx kullanımdan kaldırma
  uyarısı sürüyor; testler geçiyor.

Çalışan servislerle isteğe bağlı canlı test:

```powershell
$env:CROPGUARD_TEST_BASE_URL='http://localhost:3107'
node backend/tests/liveIntegration.mjs
```

Testlerdeki yapay günlük kayıtlar yalnızca test dosyalarındadır; uygulama
verisi veya hata durumunda yedek sonuç olarak kullanılmaz. Eski NASA CSV'leri,
rotasyon algoritması, katalog ve kullanıcının mevcut `backend/package-lock.json`
değişikliği değiştirilmemiştir.
