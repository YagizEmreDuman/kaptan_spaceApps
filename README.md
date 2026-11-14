# 🌱 CropGuard AI — Hastalık Döngüsü Kıran ve İklim Kayması Uyumlu Ürün Öneri Asistanı

**Takım:** Kaptan (Yağız Emre Duman, Furkan, Barbaros)  
**Hackathon:** NASA Space Apps Challenge  
**Görev (Challenge):** Field Shift: Adapting Farms with NASA Data  

---

## 🎯 Problem ve Çözüm Hikayemiz (Impact & Storytelling)
İklim değişikliğiyle birlikte geleneksel tarım takvimleri artık çalışmıyor. Çiftçiler babalarından öğrendikleri tarihlerde ekim yaptıklarında; beklenmedik sıcaklık dalgalanmaları, değişen çiy noktaları ve aşırı nem yüzünden **mantar ve tarımsal zararlı istilalarıyla** karşılaşıyor ve tüm hasatlarını kaybediyorlar.

**CropGuard AI**, bölgesel sıcaklık-nem trendlerini ve NASA uydu verilerini analiz ederek mantar/zararlı riskini minimize eden **yeni nesil, dinamik bir ekim ve görev takvimi** üretir. Doğal dil destekli "Tarla Danışmanı" arayüzü sayesinde çiftçinin mevcut bütçesini, sulama imkanını ve makine parkını dikkate alarak ütopik değil, **hemen uygulanabilir ve ekonomik olarak sürdürülebilir** bir rotasyon planı sunar.

---

## 🛰️ NASA Veri Entegrasyonu (Relevance)
Sistemimiz, karar destek mekanizmasının kalbinde **NASA POWER (Prediction Of Worldwide Energy Resources) Agroclimatology API** verilerini ve mikro-iklim tahmin modellerini kullanır:

* **`T2M` & `T2M_MAX` / `T2M_MIN` (Sıcaklık ve Gece-Gündüz Sıcaklık Farkı):** Bitki stresini ve zararlıların üreme hızını tetikleyen termal dalgalanmaları yakalamak için kullanılır.
* **`RH2M` (2 Metrede Bağıl Nem):** Mantar ve küf hastalıklarının (fungal outbreaks) kırılma noktalarını (%75+ nem eşiği) tespit etmek için analiz edilir.
* **`T2MDEW` (Çiy Noktası / Dew Point):** Yaprak ıslaklığı süresini ve sabah kırağı/nem riskini hesaplamakta kullanılır.
* **`PRECTOTCORR` (Düzeltilmiş Yağış Verisi):** Kuraklık stresini ve tarlaya traktör/makine giriş uygunluğunu (çamur riski) belirler.
* **`GWETTOP` (Yüzey Toprak Nemi):** Ekim ve sulama takviminin optimizasyonunu sağlar.

---

## 🏗️ Teknik Mimari (System Architecture)

Projemiz hız, ölçeklenebilirlik ve modülerlik için 3 katmanlı olarak tasarlanmıştır:

1. **Veri Katmanı ve Backend (Node.js & Express):**
   * NASA POWER API ve 14 günlük hava tahmin servisleriyle asenkron iletişim kurar.
   * `node-cache` tabanlı önbellekleme (Caching) mimarisi ile tekrarlayan koordinat sorgularında API limitlerini korur ve yanıt süresini ~900ms'den ~2ms'ye düşürür.
   * Çiftçi için 14 günlük otomatik **Görev ve Erken Uyarı Takvimi** üretir.

2. **Çekirdek Algoritma ve Hibrit Karar Motoru (Python):**
   * Tarımsal zararlı ve mantar üreme eşiklerini (Yüksek Nem + Spesifik Sıcaklık Aralığı) tarayan kural ve optimizasyon tabanlı hibrit motor.
   * Hastalık riskinin pik yaptığı dönemlerde hassas ürünler yerine dirençli alternatifleri (Örn: Nohut, Mercimek) ve **kaydırılmış güvenli ekim tarihlerini** hesaplar.

3. **Kullanıcı Arayüzü ve Tarla Danışmanı (HTML5, CSS3, Vanilla JS):**
   * Çiftçi dostu, karmaşıklıktan uzak harita ve kontrol paneli.
   * Çiftçinin bütçe, makine parkı ve sulama verilerini alarak kişiselleştirilmiş sezon planını görselleştirir.

---

## 🚀 API Uç Noktaları (Endpoints)

Backend sunucusu varsayılan olarak `http://localhost:3000` üzerinde çalışır:

* `POST /api/analyze-location` — Seçilen koordinat (lat/lng) için işlenmiş aylık NASA iklim göstergelerini, gece-gündüz sıcaklık farklarını ve yıllık mantar riskli gün sayısını döndürür.
* `POST /api/weather-tasks` — 14 günlük mikro-iklim tahminini ve çiftçi için üretilen aksiyon/uyarı takvimini döndürür.
* `POST /api/simulate-rotation` — Çiftçi profili ve iklim senaryolarını hibrit karar motoruna ileterek önerilen dirençli ürünü ve kaydırılmış ekim takvimini döndürür.

---

## 💻 Kurulum ve Çalıştırma

### Backend'i Başlatmak İçin:
```bash
cd backend
npm install
node server.js