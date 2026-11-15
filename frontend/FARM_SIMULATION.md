# Tarım Simülasyonu — uygulama raporu

## 1. Değiştirilen dosyalar

- `frontend/index.html`: tek CSS bağlantısı, dördüncü sekme düğmesi ve yeni
  simülasyon kapsayıcısı eklendi. Mevcut sekmelerin içerikleri korunuyor.
- `frontend/js/main.js`: mevcut analiz sonucunu yeni bileşene iletme ve tarla
  formuna dönüldüğünde animasyonu duraklatma bağlantısı eklendi.

Görev başlangıcında 93 mevcut dosyanın SHA-256 özeti alındı. Karşılaştırmada
yalnızca bu iki dosyanın değiştiği doğrulandı. Backend, Python motorları, mevcut
frontend modülleri, NASA CSV/NetCDF dosyaları ve ürün kataloğu değiştirilmedi.

## 2. Eklenen dosyalar

- `frontend/css/farmSimulation.css`: yalnızca `.farm-simulation` altında etkili stil.
- `frontend/js/modules/farmSimulation.js`: ayrı bileşen, kontroller, A/B görünümü,
  istek sıralaması, duraklatma ve bileşen yaşam döngüsü.
- `frontend/js/modules/farmSimulationModel.js`: sanal saat, istek eşleştirme ve
  mevcut motor çıktılarının görüntüleme modeli.
- `frontend/js/modules/farmSimulationApi.js`: mevcut proxy üzerinden `/predict` çağrısı.
- `frontend/js/modules/farmFieldRenderer.js`: bağımlılıksız 2D Canvas çizimleri.
- `frontend/tests/farmSimulation.test.js`: yeni özelliğe ait dokuz birim testi.
- `backend/tests/farmSimulationBrowser.mjs`: gerçek Chrome ile on etkileşim kontrolü.
- Bu rapor.
- `backend/tests/artifacts/farm-simulation-desktop.png` ve
  `backend/tests/artifacts/farm-simulation-mobile.png`: gerçek tarayıcı görüntüleri.

## 3. Çalışma mantığı

Konum analizi sonrasında **4. Tarım Simülasyonu** sekmesi açılır. Ürünler mevcut
`/catalog` yanıtından gelir: buğday, arpa, nohut, mercimek, ayçiçeği ve mısır.
Yeni ürün veya tarımsal özellik eklenmedi. Altı ürünün farklı Canvas çizimleri
vardır; bunlar görsel tasarımdır ve bilimsel ürün özellikleri olarak kullanılmaz.

Senaryo A başlangıçta formdaki ürünü, B katalogdaki diğer bir ürünü kullanır.
İki ürün aynı yağış/sıcaklık/sulama senaryosuyla ayrı ayrı mevcut motora gönderilir.
Seçili A/B kartı tarlada hangi ürünün gösterileceğini belirler. Kontroller ayrı
kopyalar üzerinde çalışır; ana form, mevcut grafikler ve NASA kaynakları değişmez.

Başlat/duraklat/sıfırla ve 1×/2×/4× hız kontrolleri yalnızca animasyon saatini
yönetir. Beş temsili aşama 30 sanal animasyon saniyesinde ilerler. Bu süreler
biyolojik büyüme süresi veya gerçek gün sayısı değildir ve tüm ürünler için
aynı görsel zaman çizelgesi kullanılır. Sıfırla; zamanı, hızı, iki ürünü ve
senaryo değerlerini başlangıç durumuna döndürür. Sekme gizlenince/dönüşte saat
duraklatılır. Görünür olmayan animasyon sürekli çizim yapmaz.

Motorun gerçek genel senaryo baskısı renk ve eğimle sürekli bir görsel temsile
dönüştürülür. Yağış ve sulama efektleri kullanıcının varsayımlarına aittir.
Kontroller değişince önceki istek iptal edilir; eski/geç gelen sonuç yeni koşulun
sonucu olarak gösterilmez. API hatasında örnek puan üretilmez. Genel baskı ve
uygunluk indeksleri başarı olasılığı veya doğrulanmış tarımsal uygunluk değildir.

NASA sıcaklık, yağış ve WET3 başlangıç değerleri ayrı; kullanıcı değişiklikleri
ve motorun varsayımsal sıcaklık/yağış çıktıları ayrı kutularda gösterilir.
Yağış tahmini yoksa `null` korunur; geçmiş yağış yalnızca ayrı referanstır.

## 4. Kullanılan mevcut API alanları

Yeni endpoint yoktur. Yeni bileşen mevcut
`POST /api/simulate-rotation` proxy'sini kullanır; proxy mevcut
`POST http://localhost:5000/predict` adresine aynı sözleşmeyle iletir:

- `location.latitude`, `location.longitude`: mevcut konum.
- `climateSummary`: mevcut sözleşmedeki alan; yeni model eklenmez.
- `forecast.month`: mevcut analiz ayı.
- `farmerInputs.currentRotation`: seçilen senaryo ürünü iki kez; mevcut tek ana
  ürün formunun kullandığı eşleştirme korunur.
- `farmerInputs.irrigationAvailable` ve diğer mevcut çiftçi girdileri korunur.
- `scenario.rainfallChangePct`: göreli yağış değişimi.
- `scenario.temperatureChangeC`: sıcaklık farkı.
- `scenario.irrigationAvailabilityChangePct`: göreli sulama erişimi değişimi.

Gösterilen çıktılar: `forecast`, `historicalClimate`,
`scenarioAnalysis.indicativeScenarioPressureIndex0to100`,
`scenarioAnalysis.projectedMonthlyTemperatureC`,
`scenarioAnalysis.projectedMonthlyPrecipitationMm` ve mevcut rotasyonun
`indicativeSuitabilityIndex0to100` değeri. Bu sayılar tarayıcıda yeniden hesaplanmaz.

## 5. Testler

Depo kökünden:

```powershell
node --test frontend/tests/*.test.js backend/tests/api.test.js
& '.venv/Scripts/python.exe' -m pytest 'algorithm/NASA data/tests' -q
node backend/tests/farmSimulationBrowser.mjs
```

- 27 frontend/Node testi başarılı: 9 yeni simülasyon testi ve 18 mevcut test.
- 21 mevcut algorithm testi başarılı. Toplam 48 otomatik test başarılı.
- Gerçek Chrome'da aşağıdaki on kontrol başarılı:
  1. Simülasyonun açılması ve canlı kataloğun yüklenmesi.
  2. Buğday çiziminin seçilmesi.
  3. Arpa ve diğer dört ürünün farklı çizimlere geçmesi; altı farklı Canvas çıktısı.
  4. Yağış değişiminde iki senaryonun API isteklerinin ve görselin güncellenmesi.
  5. Sıcaklık değişiminde aynı kontrol.
  6. Sulama değişiminde aynı kontrol.
  7. Başlat, duraklat, sıfırla, hızlandır ve beş gelişim aşaması.
  8. Gerçek `/predict` yanıtı ve ana form girdilerinin değişmemesi.
  9. A/B geçişinde koşulların/zamanın korunması ve gereksiz yeniden istek yapılmaması.
  10. 390 px mobil görünümde taşma olmaması.
- API isteği engellenerek hata davranışı ve sonuçların uydurulmaması; ardından
  yeniden bağlantı ayrıca doğrulandı. Yeni bileşende JavaScript hatası görülmedi.
- Başarısız kalan test yok. İlk tarayıcı denemesinde test betiğindeki sayısal
  CSS seçicisi hatası düzeltildi; sonraki çalıştırmada on kontrol de tamamlandı.
- Mevcut Python test ortamının Starlette/httpx kullanımdan kaldırma uyarısı sürer.

## 6. Mevcut modelin desteklemediği özellikler

- Ürüne özgü biyolojik büyüme hızı, fenoloji/gerçek hasat tarihi.
- Ayrı su stresi veya sıcaklık stresi göstergesi; bitki sağlığı/solma teşhisi.
- Kesin hasat miktarı, ürün ölümü veya başarı olasılığı.
- Litre/mm cinsinden sulama miktarı ve fiziksel su dengesi.
- Veri bulunmayan aylarda NASA yağış veya toprak nemi tahmini.

Bu özellikler için yeni bilimsel değer veya model uydurulmadı. Görseller temsili
olarak etiketlendi; genel baskı üründen bağımsız olduğu için aynı koşullarda
iki üründe aynı çıkabilir. Ürün farkı yalnızca mevcut motorun desteklediği
uygunluk göstergesi ve katalog/çizim farklarıyla sınırlıdır.
