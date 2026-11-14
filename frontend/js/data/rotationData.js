export const CROP_ROTATION_TEMPLATES = {
  bugday: {
    label: 'Ekmeklik Buğday',
    baseRevenuePerDekar: 4200,
    baseline: {
      title: 'Mevcut Geleneksel Rotasyon',
      badge: 'YÜKSEK RİSK',
      subtitle: 'Klasik Ekim + Tekrar Buğday / Nadas',
      plantingWindow: '15 – 28 Ekim (Geleneksel)',
      sequence: ['Klasik Ekmeklik Buğday', 'Nadas (Boş Toprak)', 'Klasik Ekmeklik Buğday'],
      soilImpact: 'Organik madde kaybı & erozyon riski',
      reason: 'Nisan-Mayıs çiy döneminde sarı pas mantarına yakalanır; Haziran sıcak dalgası tane dolumunu erken keser.'
    },
    alt1: {
      title: 'Alternatif 1: Tarih Kaydırmalı & Dirençli',
      badge: 'ÖNERİLEN • DENGELİ',
      subtitle: 'Erken Ekim + Pas-Dirençli Çeşit + Fiğ',
      plantingWindow: '26 Eylül – 6 Ekim (-18 Gün Erken)',
      sequence: ['Sarı Pas Dirençli Buğday (Sertifikalı)', 'Kışlık Macar Fiği (Yeşil Gübre)', 'Erkenci Ekmeklik Buğday'],
      soilImpact: '+12 kg/da doğal azot kazanımı',
      reason: '18 gün erken ekim sayesinde başaklanma yaz sıcaklarından önce tamamlanır; pas dirençli genotip ilaç maliyetini %60 düşürür.'
    },
    alt2: {
      title: 'Alternatif 2: İklim-Akıllı Baklagil Münavebesi',
      badge: 'MAKSİMUM KORUMA',
      subtitle: 'Tritikale/Arpa + Nohut + Yağlık Ayçiçeği',
      plantingWindow: '22 Eylül – 2 Ekim (-22 Gün Erken)',
      sequence: ['Kuraklığa Dayanıklı Tritikale / Arpa', 'Kışlık Nohut / Kırmızı Mercimek', 'Orobanş Dirençli Yağlık Ayçiçeği'],
      soilImpact: 'Derin kök yapısı + yüksek su tutulumu',
      reason: 'Monokültür hastalık döngüsünü tamamen sıfırlar; baklagil ara dönemi toprağı azotça zenginleştirerek kuraklık direncini artırır.'
    }
  },
  misir: {
    label: 'Dane Mısır',
    baseRevenuePerDekar: 7600,
    baseline: {
      title: 'Mevcut Geleneksel Rotasyon',
      badge: 'YÜKSEK RİSK',
      subtitle: 'Geç Bahar Ekimi + Üst Üste Mısır',
      plantingWindow: '25 Nisan – 10 Mayıs (Geleneksel)',
      sequence: ['Standart Geçci Hibrit Mısır', 'Kışlık Boş Tarla', 'Standart Geçci Hibrit Mısır'],
      soilImpact: 'Yüksek su ve azot tüketimi',
      reason: 'Temmuz-Ağustos aşırı sıcak dalgasında (>35°C) tozlaşma yanması yaşanır ve sulama maliyeti kritik seviyeye çıkar.'
    },
    alt1: {
      title: 'Alternatif 1: Erkenci Hibrit & Erken Ekim',
      badge: 'ÖNERİLEN • DENGELİ',
      subtitle: 'Erken Bahar + FAO 500 Kuraklık Toleranslı',
      plantingWindow: '28 Mart – 8 Nisan (-25 Gün Erken)',
      sequence: ['FAO 500 Erkenci Toleranslı Mısır', 'Kışlık Yem Bezelyesi (Örtü Bitkisi)', 'Erkenci Dane Mısır'],
      soilImpact: 'Yüzey buharlaşmasında %22 azalma',
      reason: 'Toprak ısınır ısınmaz yapılan erken ekim ile çiçeklenme Haziran sonunda tamamlanır; koçan tane tutumu korunur.'
    },
    alt2: {
      title: 'Alternatif 2: Düşük Su & Yüksek Kâr Rotasyonu',
      badge: 'MAKSİMUM KORUMA',
      subtitle: 'Tane Sorgum + Kuru Fasulye + Buğday',
      plantingWindow: '2 – 12 Nisan (-20 Gün Erken)',
      sequence: ['Kuraklığa Dayanıklı Tane Sorgum', 'Kışlık Kuru Fasulye / Mercimek', 'Sertifikalı Ekmeklik Buğday'],
      soilImpact: 'Tuzluluk ve su stresi rehabilitasyonu',
      reason: 'Sorgum, mısıra kıyasla %38 daha az su tüketirken benzer yem/dane verimi sunar; araya giren baklagil toprağı dinlendirir.'
    }
  },
  domates: {
    label: 'Salçalık Domates',
    baseRevenuePerDekar: 11500,
    baseline: {
      title: 'Mevcut Geleneksel Rotasyon',
      badge: 'YÜKSEK RİSK',
      subtitle: 'Klasik Mayıs Dikimi + Sürekli Domates',
      plantingWindow: '1 – 15 Mayıs (Geleneksel)',
      sequence: ['Standart Salçalık Domates', 'Kışlık Boş Parsel', 'Standart Salçalık Domates'],
      soilImpact: 'Toprakta Fusarium & Nematod birikimi',
      reason: 'Bahar sonu neminde Mildiyö mantarı hızla yayılır; Ağustos sıcağında meyve güneş yanığı ve çiçek burnu çürüklüğü artar.'
    },
    alt1: {
      title: 'Alternatif 1: Erken Dikim & Dirençli Hibrit',
      badge: 'ÖNERİLEN • DENGELİ',
      subtitle: 'Malçlı Erken Dikim + Mildiyö Dirençli Çeşit',
      plantingWindow: '12 – 22 Nisan (-19 Gün Erken)',
      sequence: ['Mildiyö/Fusarium Dirençli Domates', 'Sonbahar Ispanak / Marul Ara Ekimi', 'Kışlık Yeşil Gübre (Fiğ)'],
      soilImpact: 'Malçlama ile toprak nemi & sıcaklık dengesi',
      reason: 'Dirençli hibrit kullanımı mantar salgınını durdurur; erken dikim meyve tutumunu serin dönemde garanti altına alır.'
    },
    alt2: {
      title: 'Alternatif 2: Patojen Kıran 3’lü Münavebe',
      badge: 'MAKSİMUM KORUMA',
      subtitle: 'Dirençli Domates + Tahıl + Baklagil',
      plantingWindow: '10 – 20 Nisan (-21 Gün Erken)',
      sequence: ['Dirençli Salçalık Domates', 'Kışlık Arpa / Buğday (Patojen Bariyeri)', 'Kuru Fasulye / Barbunya'],
      soilImpact: 'Tam biyolojik toprak yenilenmesi',
      reason: 'Tahıl ve baklagil geçişi topraktaki Solanaceae mantar sporlarını %80 oranında azaltır, gübre ve ilaç giderini düşürür.'
    }
  },
  aycicegi: {
    label: 'Ayçiçeği',
    baseRevenuePerDekar: 4800,
    baseline: {
      title: 'Mevcut Geleneksel Rotasyon',
      badge: 'YÜKSEK RİSK',
      subtitle: 'Klasik Nisan Ekimi + Dar Münavebe',
      plantingWindow: '15 – 30 Nisan (Geleneksel)',
      sequence: ['Klasik Yağlık Ayçiçeği', 'Klasik Buğday', 'Klasik Yağlık Ayçiçeği'],
      soilImpact: 'Orobanş (Canavar Otu) parazit riski',
      reason: 'Geç ekim nedeniyle tabla dolumu Temmuz-Ağustos kuraklığına denk gelir; yağ oranı ve dekara verim düşer.'
    },
    alt1: {
      title: 'Alternatif 1: Nem Yakalayan Erken Ekim',
      badge: 'ÖNERİLEN • DENGELİ',
      subtitle: 'Kış Sonu Nemi + Yüksek Oleik Dirençli Çeşit',
      plantingWindow: '22 Mart – 3 Nisan (-23 Gün Erken)',
      sequence: ['Orobanş & Mildiyö Dirençli Ayçiçeği', 'Kışlık Yulaf (Örtü Bitkisi)', 'Pas Dirençli Ekmeklik Buğday'],
      soilImpact: 'Kök bölgesinde +18% nem muhafazası',
      reason: 'Kıştan kalan toprak nemiyle derin kazık kök geliştiren bitki, yaz sıcağında bile yüksek yağ oranını korur.'
    },
    alt2: {
      title: 'Alternatif 2: Baklagil Destekli Yağ Rotasyonu',
      badge: 'MAKSİMUM KORUMA',
      subtitle: 'Yüksek Oleik Ayçiçeği + Nohut + Arpa',
      plantingWindow: '20 – 31 Mart (-25 Gün Erken)',
      sequence: ['Yüksek Oleik Hibrit Ayçiçeği', 'Kuraklığa Dayanıklı Nohut', 'Erkenci Yemlik / Maltlık Arpa'],
      soilImpact: 'Doğal azot fiksasyonu + yabancı ot kontrolü',
      reason: 'Nohut ekimi hem toprağa doğal azot bağlar hem de ayçiçeğindeki mantar ve parazit ot baskısını kırar.'
    }
  },
  pamuk: {
    label: 'Pamuk',
    baseRevenuePerDekar: 8900,
    baseline: {
      title: 'Mevcut Geleneksel Rotasyon',
      badge: 'YÜKSEK RİSK',
      subtitle: 'Klasik Mayıs Ekimi + Sürekli Pamuk',
      plantingWindow: '25 Nisan – 10 Mayıs (Geleneksel)',
      sequence: ['Standart Geçci Pamuk', 'Kışlık Boş Tarla', 'Standart Geçci Pamuk'],
      soilImpact: 'Verticillium solgunluğu & tuzluluk riski',
      reason: 'Geç ekim hasadı Ekim-Kasım yağışlarına iter; koza çürüklüğü, lif kalitesi kaybı ve aşırı sulama maliyeti doğurur.'
    },
    alt1: {
      title: 'Alternatif 1: Erkenci Lif & Kaydırılmış Ekim',
      badge: 'ÖNERİLEN • DENGELİ',
      subtitle: 'Erken Ekim + Solgunluk Dirençli Çeşit',
      plantingWindow: '5 – 16 Nisan (-19 Gün Erken)',
      sequence: ['Erkenci Verticillium Dirençli Pamuk', 'Kışlık Bakla / Fiğ (Yeşil Gübre)', 'Erkenci Pamuk'],
      soilImpact: 'Organik madde takviyesi & toprak gevşetme',
      reason: 'Erkenci çeşit ve kaydırılmış ekim ile kozalar Eylül sonunda kuru havada açar; 1–2 sulama turu tasarruf edilir.'
    },
    alt2: {
      title: 'Alternatif 2: Su & Tuzluluk Dengeleyici Münavebe',
      badge: 'MAKSİMUM KORUMA',
      subtitle: 'Erkenci Pamuk + Kışlık Buğday + Soya',
      plantingWindow: '3 – 14 Nisan (-21 Gün Erken)',
      sequence: ['Erkenci Sertifikalı Pamuk', 'Kışlık Makarnalık Buğday', 'İkinci Ürün Soya / Yerfıstığı'],
      soilImpact: 'Toprak tuzluluğunda düşüş & azot dengesi',
      reason: 'Tahıl ve baklagil rotasyonu pamukta görülen solgunluk mantarını durdururken sezonluk su ayak izini %30 azaltır.'
    }
  },
  seker_pancari: {
    label: 'Şeker Pancarı',
    baseRevenuePerDekar: 9400,
    baseline: {
      title: 'Mevcut Geleneksel Rotasyon',
      badge: 'YÜKSEK RİSK',
      subtitle: 'Klasik Nisan Ekimi + Dar Münavebe',
      plantingWindow: '10 – 25 Nisan (Geleneksel)',
      sequence: ['Standart Şeker Pancarı', 'Buğday', 'Standart Şeker Pancarı'],
      soilImpact: 'Nematod & Cercospora yaprak lekesi riski',
      reason: 'Yaz sıcak dalgaları yaprak alanını yakarak polar (şeker) oranını düşürür; sulama ve fungisit maliyeti artar.'
    },
    alt1: {
      title: 'Alternatif 1: Erken Ekim & Cercospora Dirençli',
      badge: 'ÖNERİLEN • DENGELİ',
      subtitle: 'Erken Bahar + Yaprak Lekesi Dirençli Çeşit',
      plantingWindow: '16 – 28 Mart (-24 Gün Erken)',
      sequence: ['Cercospora & Rizomani Dirençli Pancar', 'Kışlık Arpa', 'Kışlık Macar Fiği (Ara Ürün)'],
      soilImpact: 'Erken gölgeleme ile toprak nemi koruması',
      reason: '24 gün erken ekim bitkinin yaz sıcağı gelmeden toprağı tamamen gölgelemesini sağlar; şeker (polar) oranı %1.8 artar.'
    },
    alt2: {
      title: 'Alternatif 2: 4’lü Tam Rehabilitasyon Rotasyonu',
      badge: 'MAKSİMUM KORUMA',
      subtitle: 'Dirençli Pancar + Tahıl + Baklagil + Ayçiçeği',
      plantingWindow: '14 – 25 Mart (-26 Gün Erken)',
      sequence: ['Dirençli Şeker Pancarı', 'Sertifikalı Ekmeklik Buğday', 'Kuru Fasulye / Nohut'],
      soilImpact: 'Maksimum toprak strüktürü ve su tutma kapasitesi',
      reason: 'Geniş münavebe aralığı toprak patojenlerini tamamen temizler; damla sulama ile birleştiğinde %34 su tasarrufu sağlar.'
    }
  }
};