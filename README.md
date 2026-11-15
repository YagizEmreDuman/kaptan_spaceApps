# 🌱 CropGuard AI — Hastalık Döngüsü Kıran ve İklim Kayması Uyumlu Ürün Öneri Asistanı

**Takım:** Kaptan (Yağız Emre Duman, Furkan, Barbaros)  
**Hackathon:** NASA Space Apps Challenge  
**Görev (Challenge):** Field Shift: Adapting Farms with NASA Data  

---

## 🎯 Problem ve Çözüm Hikayemiz (Impact & Storytelling)
İklim değişikliğiyle birlikte geleneksel tarım takvimleri artık çalışmıyor. Çiftçiler alışageldikleri klasik tarihlerde ve aynı bitki ailesiyle üst üste (monokültür) ekim yaptıklarında; beklenmedik sıcaklık anomalileri, kök bölgesi kuraklığı ve zamansız nem dalgalanmaları yüzünden **mantar/pas hastalıkları ve ağır verim kayıplarıyla** karşılaşıyorlar.

**CropGuard AI**, **NASA GEOS-S2S** mevsimlik tahminlerini, **NASA POWER** 20 yıllık (`2006–2025`) tarihsel iklim serilerini, **CMIP6** çoklu-model yağış projeksiyonlarını ve **Open-Meteo** 14 günlük saha verilerini birleştirerek çiftçiye özel, **dinamik bir ürün rotasyonu ve kaydırılmış ekim takvimi** üretir. Çiftçinin tarla koordinatını, toprak tipini (`Tınlı`, `Killi`, `Kumlu`, `Kireçli`), toprak `pH` değerini, parsel büyüklüğünü (`dekar`), bütçesini, sulama yöntemini ve makine parkını dikkate alarak **hemen uygulanabilir ve ekonomik olarak sürdürülebilir** karar desteği sunar.

---

## 🛰️ NASA & İklim Veri Entegrasyonu (Data Sources)
Sistemimiz karar destek mekanizmasının kalbinde çok katmanlı uydu, model ve gözlem verilerini kullanır:

### 1. NASA GEOS-S2S (Subseasonal-to-Seasonal) Mevsimlik Tahminleri
* **`T2M` (2 Metrede Aylık Sıcaklık Tahmini):** Türkiye genelindeki grid noktaları için 9 aylık ileri yönlü (`2026-11` – `2027-07`) mevsimlik sıcaklık projeksiyonları.
* **`WET3` (Kök Bölgesi Toprak Islaklığı İndeksi, `0–1`):** Bitki kök derinliğindeki nem doygunluğunu ve kuraklık baskısını ölçer.

### 2. NASA POWER (Prediction Of Worldwide Energy Resources) Agroclimatology (`2006–2025`)
* **20 Yıllık Referans İklim Serisi (63.600+ Aylık Kayıt, 265 Türkiye Grid Noktası):**
  * **`T2M` / `T2M_MAX` / `T2M_MIN`:** Uzun dönem aylık sıcaklık ortalamaları ve termal anomaliler (`temperature_difference_vs_power_c_unadjusted`).
  * **`PRECTOTCORR` (`precipitation_mm`):** Düzeltilmiş aylık yağış ortalamaları, 1 ve 3 aylık yağış açığı oranları (`rain_shortfall_ratio`).
  * **`GWETROOT` & `GWETTOP`:** Kök bölgesi ve yüzey toprak nemi tarihsel Z-skor anomalileri.
  * **`RH2M` & `T2MDEW`:** Bağıl nem ve çiy noktası ile yaprak ıslaklığı / mantar (pas, septorya, antraknoz) risk eşiği analizi.

### 3. CMIP6 Çoklu-Model Yağış Projeksiyonu & Open-Meteo Canlı Saha Servisi
* **CMIP6 HighResMIP Ensemble (`EC_Earth3P_HR`, `MRI_AGCM3_2_S`, `MPI_ESM1_2_XR`):** `2026–2027` tarım sezonu için aylık küresel iklim modeli yağış projeksiyonları (`mm/ay`).
* **Open-Meteo 14 Günlük Tahmin API:** Seçilen parsel koordinatı için canlı günlük maksimum/minimum sıcaklık, yağış, bağıl nem ve rüzgâr hızı verileriyle otomatik **Çiftçi Saha Bildirimleri ve İş Takvimi** üretimi.

### 4. FAO Ürün Su Tüketimi (ET) ve Agronomik Katalog
* **FAO Irrigation and Drainage Paper 24 (`s2022e07` & `Y5146E`):** `Buğday`, `Arpa`, `Nohut`, `Mercimek`, `Ayçiçeği` ve `Mısır` için sezonluk evapotranspirasyon (`ET`, `mm`) aralıkları, bitki ailesi (`tahıl`, `baklagil`, `yağlı tohum`), kuraklık toleransı ve toprak/pH uyumluluk katsayıları.

---

## ✨ Temel Özellikler

* **🗺️ İnteraktif Harita & Uydu Parsel Seçimi:** Leaflet tabanlı sokak/uydu (`Esri World Imagery`) haritası, 81 il/bölge hazır profili, şehir arama ve GPS konum bulma; tıklanan her nokta için en yakın 3 NASA grid noktasından **Ters Mesafe Ağırlıklı (IDW)** mekânsal interpolasyon.
* **🔄 Dinamik Ürün Rotasyonu & Ekonomik Analiz:** Mevcut monokültür plan ile en yüksek puanlı 2 alternatif rotasyonun uygunluk puanı (`0–100`), bölgesel iklim ve toprak tipine göre **önerilen erken ekim penceresi (`-X Gün Erken Ekim`)**, **su tasarrufu (`%`)**, **verim koruma/kayıp oranı (`%`)** ve **net sezonluk gelir farkı (`₺`)** karşılaştırması.
* **🌾 3B Perspektif "Sanal Tarla" Simülasyonu:** İki farklı ürünü (`Senaryo A` ve `Senaryo B`) aynı iklim, toprak ve sulama koşullarında 5 fenolojik gelişim aşaması boyunca (`Tohum/Ekim → Çimlenme → Büyüme → Gelişmiş Bitki → Hasat`) yan yana test eden interaktif kanvas animasyonu.
* **📅 12 Aylık Fenolojik Ekim Takvimi & 14 Günlük Saha Görevleri:** Seçilen rotasyon stratejisine, toprak dokusuna ve NASA aylık tahminlerine göre özelleştirilmiş 8 aşamalı sezon yol haritası ve işaretlenebilir 14 günlük çiftçi uyarı listesi.
* **🌍 12 Dil Desteği (i18n):** Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca, Rusça, Arapça, Çince, Japonca, Portekizce ve Felemenkçe arayüz desteği.

---

## 🏗️ Teknik Mimari (System Architecture)

Proje 3 katmanlı ve çevrimdışı/tarayıcı yedekli (hybrid fallback) mimariyle tasarlanmıştır:

1. **Kullanıcı Arayüzü ve Yerel NASA Karar Motoru (`frontend/` — HTML5, Tailwind CSS, Chart.js, Leaflet, ES Modules):**
   * Sunucu kapalı olsa bile tarayıcı içinde çalışan [localAlgorithmEngine.js](frontend/js/modules/localAlgorithmEngine.js) ve 265 Türkiye grid noktalı [nasaGridData.js](frontend/js/data/nasaGridData.js) sayesinde kesintisiz analiz ve simülasyon imkanı.
   * [farmFieldRenderer.js](frontend/js/modules/farmFieldRenderer.js) ile 3B perspektif izdüşümlü sanal tarla çizimi.

2. **API Ağ Geçidi ve Hava Durumu Servisi (`backend/` — Node.js & Express):**
   * `http://localhost:3000` üzerinde statik ön yüzü sunar, `node-cache` ile koordinat sorgularını önbelleğe alır ve Python karar motoru ile Open-Meteo servislerini köprüler.

3. **Bilimsel Veri İşleme ve Karar Motoru (`algorithm/NASA data/` — Python, FastAPI, Pandas, Xarray/NetCDF4):**
   * NASA GEOS-S2S NetCDF4 (`.nc4`) ve NASA POWER CSV veri setlerini işleyen [forecast_integration.py](algorithm/NASA%20data/forecast_integration.py), [gorev8_risk_analizi.py](algorithm/NASA%20data/gorev8_risk_analizi.py) ve [decision_engine.py](algorithm/NASA%20data/decision_engine.py) modülleri.

---

## 🚀 API Uç Noktaları (Endpoints)

### Node.js Backend (`http://localhost:3000`)
* `GET /api/catalog` — Ürün kataloğunu, FAO sezonluk `ET` su rehberini ve mevcut NASA tahmin aylarını (`2026-11` – `2027-07`) döndürür.
* `POST /api/simulate-rotation` — Koordinat, tahmin ayı, toprak tipi/pH, sulama durumu ve iklim senaryosu sürgülerini alarak aylık NASA/CMIP6 tahminlerini, stres indekslerini ve 3 rotasyon stratejisini döndürür.
* `POST /api/weather-tasks` — Seçilen koordinat için 14 günlük hava tahminini ve otomatik üretilen çiftçi saha görevlerini döndürür.
* `POST /api/analyze-location` — Seçilen koordinat için tarihsel NASA POWER agro-iklim özetini döndürür.

### Python FastAPI Servisi (`http://127.0.0.1:5000`)
* `GET /catalog` — Algoritma ürün ve tahmin kapsamı kataloğu.
* `POST /predict` — NASA GEOS-S2S + POWER tabanlı senaryo ve rotasyon değerlendirmesi.

---

## 💻 Kurulum ve Çalıştırma

### 1. Hızlı Başlangıç (Doğrudan Tarayıcı / Live Server)
Ön yüz, gömülü NASA Türkiye grid veri tabanı ve doğrudan Open-Meteo/CMIP6 bağlantısı sayesinde ek bir sunucu kurulumu gerektirmeden de çalışır:
* VS Code **Live Server** eklentisiyle `frontend/index.html` dosyasını açabilir veya herhangi bir statik sunucuyla `frontend/` klasörünü çalıştırabilirsiniz.

### 2. Node.js Backend İle Çalıştırma (`http://localhost:3000`)
```bash
cd backend
npm install
npm start
```
Ardından tarayıcınızda `http://localhost:3000` adresini açın.

### 3. Python FastAPI Karar Motorunu Çalıştırma (Opsiyonel — `http://127.0.0.1:5000`)
```bash
pip install -r "algorithm/NASA data/requirements-forecast.txt"
python -m uvicorn api:app --app-dir "algorithm/NASA data" --host 127.0.0.1 --port 5000
```

### 4. Birim ve Entegrasyon Testlerini Çalıştırma
```bash
# Frontend birim testleri (21 test)
node --test frontend/tests/dynamicData.test.js frontend/tests/farmSimulation.test.js

# Python algoritma ve veri entegrasyon testleri (20 test)
pytest "algorithm/NASA data/tests" -q
```
