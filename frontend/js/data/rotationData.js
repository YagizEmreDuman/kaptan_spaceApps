export const CROP_ROTATION_TEMPLATES = {
  bugday: {
    label: 'Ekmeklik Buğday',
    baseRevenuePerDekar: 4200,
    baseline: {
      badge: 'MEVCUT PLAN',
      title: 'Geleneksel Monokültür Buğday',
      subtitle: 'Klasik Ekim Takvimi (15–28 Ekim)',
      plantingWindow: '15–28 Ekim (Geleneksel)',
      sequence: ['Ekmeklik Buğday', 'Ekmeklik Buğday', 'Nadas / Buğday'],
      reason: 'Üst üste tahıl ekimi toprakta sarı pas ve kök çürüklüğü sporlarını biriktirir; geç ekim Haziran sıcağına yakalanır.',
      soilImpact: 'Azot yorgunluğu & patojen birikimi'
    },
    alt1: {
      badge: 'ÖNERİLEN STRATEJİ 1',
      title: 'Erkenci Dirençli Buğday + Baklagil Rotasyonu',
      subtitle: '18 Gün Öne Çekilmiş Ekim + Doğal Azot',
      plantingWindow: '26 Eylül – 6 Ekim (-18 Gün)',
      sequence: ['Yr Dirençli Buğday', 'Nohut / Mercimek', 'Macar Fiği + Buğday'],
      reason: 'Erken ekim bitkinin bahar mantar zirvesinden önce güçlenmesini sağlar; baklagil ara sezonu toprakta doğal azot bağlar.',
      soilImpact: '+12 kg/da doğal azot & mantar kırımı'
    },
    alt2: {
      badge: 'ALTERNATİF STRATEJİ 2',
      title: 'Kuraklık Kalkanı: Tritikale & Yağlık Ayçiçeği',
      subtitle: '22 Gün Erken Ekim + Derin Kök Dengesi',
      plantingWindow: '22 Eylül – 2 Ekim (-22 Gün)',
      sequence: ['Sertifikalı Tritikale', 'Orobanş Dirençli Ayçiçeği', 'Kışlık Fiğ + Buğday'],
      reason: 'Düşük yağış projeksiyonlarında su tüketimini %35 azaltır ve farklı kök derinlikleriyle toprak katmanlarını dengeler.',
      soilImpact: 'Yüksek nem muhafazası & düşük tuzluluk'
    }
  },
  misir: {
    label: 'Dane Mısır',
    baseRevenuePerDekar: 6800,
    baseline: {
      badge: 'MEVCUT PLAN',
      title: 'Geleneksel Geçci Dane Mısır',
      subtitle: 'Mayıs Başı Ekim (Yüksek Sıcak Riski)',
      plantingWindow: '25 Nisan – 10 Mayıs',
      sequence: ['Standart Mısır', 'Standart Mısır', 'Buğday'],
      reason: 'Temmuz-Ağustos sıcak dalgası tozlaşma dönemine denk gelir; su tüketimi ve koçan yanıklığı riski yükselir.',
      soilImpact: 'Yüksek su tüketimi & tuz birikimi'
    },
    alt1: {
      badge: 'ÖNERİLEN STRATEJİ 1',
      title: 'FAO 500 Erkenci Hibrit + Kışlık Yem Bezelyesi',
      subtitle: '25 Gün Erken Ekim + Örtü Bitkisi',
      plantingWindow: '28 Mart – 8 Nisan (-25 Gün)',
      sequence: ['FAO 500 Erkenci Mısır', 'Kışlık Yem Bezelyesi', 'Ekmeklik Buğday'],
      reason: 'Tozlaşma Haziran sonunda tamamlanarak Temmuz aşırı sıcaklarından kaçar; kışlık örtü bitkisi toprak nemini kilitler.',
      soilImpact: 'Organik madde artışı & %22 su tasarrufu'
    },
    alt2: {
      badge: 'ALTERNATİF STRATEJİ 2',
      title: 'Kuraklık Toleranslı Tane Sorgum & Soya Döngüsü',
      subtitle: 'Maksimum Su Tasarrufu Stratejisi',
      plantingWindow: '2–12 Nisan (-20 Gün)',
      sequence: ['Hibrit Tane Sorgum', 'İkinci Ürün Soya', 'Kışlık Arpa'],
      reason: 'Sorgum yüksek sıcaklıkta yapraklarını kıvırarak suyu korur; soya rotasyonu toprağı azotça zenginleştirir.',
      soilImpact: '%35 su tasarrufu & biyolojik azot'
    }
  },
  domates: {
    label: 'Salçalık Domates',
    baseRevenuePerDekar: 11500,
    baseline: {
      badge: 'MEVCUT PLAN',
      title: 'Klasik Mayıs Dikimi Salçalık Domates',
      subtitle: 'Üst Üste Sebze Ekimi',
      plantingWindow: '1–15 Mayıs',
      sequence: ['Salçalık Domates', 'Biber / Patlıcan', 'Salçalık Domates'],
      reason: 'Aynı familyadan bitkiler toprakta Mildiyö ve Fusarium mantarlarını kalıcı hale getirir.',
      soilImpact: 'Toprak kökenli mantar & nematod yükü'
    },
    alt1: {
      badge: 'ÖNERİLEN STRATEJİ 1',
      title: 'Mildiyö Dirençli Hibrit + Tahıl Bariyer Ekimi',
      subtitle: '19 Gün Erken Dikim + Patojen Kırımı',
      plantingWindow: '12–22 Nisan (-19 Gün)',
      sequence: ['Dirençli Salçalık Hibrit', 'Kışlık Ekmeklik Buğday', 'Oturak Kuru Fasulye'],
      reason: 'Tahıl ara sezonu mantar sporlarının kışlamasını durdurur; erken dikim Ağustos güneş yanığını azaltır.',
      soilImpact: 'Toprak dezenfeksiyonu & dengeli pH'
    },
    alt2: {
      badge: 'ALTERNATİF STRATEJİ 2',
      title: 'Erkenci Hibrit + Baklagil Yeşil Gübre Döngüsü',
      subtitle: 'Düşük İlaç Maliyetli Rotasyon',
      plantingWindow: '10–20 Nisan (-21 Gün)',
      sequence: ['Erkenci Dirençli Domates', 'Kışlık Macar Fiği', 'Tatlı Mısır / Fasulye'],
      reason: 'Fungisit ilaçlama ihtiyacını %60 azaltırken meyve tutumunu erken serin dönemde tamamlar.',
      soilImpact: 'Yüksek humus & kök havalanması'
    }
  },
  aycicegi: {
    label: 'Ayçiçeği',
    baseRevenuePerDekar: 4600,
    baseline: {
      badge: 'MEVCUT PLAN',
      title: 'Standart Yağlık Ayçiçeği - Buğday',
      subtitle: 'Dar 2\'li Rotasyon',
      plantingWindow: '15–30 Nisan',
      sequence: ['Standart Ayçiçeği', 'Buğday', 'Standart Ayçiçeği'],
      reason: 'Sık ayçiçeği dönüşü Orobanş paraziti ve köse (mildiyö) riskini artırır.',
      soilImpact: 'Derin toprak nemi kaybı'
    },
    alt1: {
      badge: 'ÖNERİLEN STRATEJİ 1',
      title: 'Yüksek Oleik Dirençli Ayçiçeği + Nohut',
      subtitle: '23 Gün Erken Ekim + 3\'lü Geniş Döngü',
      plantingWindow: '22 Mart – 3 Nisan (-23 Gün)',
      sequence: ['Orobanş Dirençli Ayçiçeği', 'Kuraklığa Dayanıklı Nohut', 'Sertifikalı Buğday'],
      reason: 'Kış sonu nemiyle derin kazık kök geliştirir; nohut ara ürünü parazit döngüsünü tamamen kırar.',
      soilImpact: 'Derin kök dengesi & azot fiksasyonu'
    },
    alt2: {
      badge: 'ALTERNATİF STRATEJİ 2',
      title: 'Erkenci Hibrit + Kışlık Yulaf Malç Sistemi',
      subtitle: 'Kuru Tarım Nem Kalkanı',
      plantingWindow: '20–31 Mart (-25 Gün)',
      sequence: ['Erkenci Yüksek Oleik', 'Kışlık Yulaf Örtüsü', 'Mercimek / Arpa'],
      reason: 'Bahar rüzgarlarının yüzey nemini uçurmasını önleyerek yağışsız yazlarda bile tabla dolumu sağlar.',
      soilImpact: 'Maksimum yüzey nem koruması'
    }
  },
  pamuk: {
    label: 'Pamuk',
    baseRevenuePerDekar: 8400,
    baseline: {
      badge: 'MEVCUT PLAN',
      title: 'Geleneksel Monokültür Pamuk',
      subtitle: 'Geç Ekim & Sonbahar Yağış Riski',
      plantingWindow: '25 Nisan – 10 Mayıs',
      sequence: ['Standart Pamuk', 'Standart Pamuk', 'Standart Pamuk'],
      reason: 'Geç hasat Ekim yağışlarına yakalanarak koza çürüklüğü ve lif kalitesi kaybına yol açar.',
      soilImpact: 'Tuzluluk artışı & solgunluk mantarı'
    },
    alt1: {
      badge: 'ÖNERİLEN STRATEJİ 1',
      title: 'Erkenci Solgunluk Dirençli Pamuk + Buğday/Soya',
      subtitle: '19 Gün Erken Ekim + Eylül Sonu Hasat',
      plantingWindow: '5–16 Nisan (-19 Gün)',
      sequence: ['Verticillium Dirençli Pamuk', 'Kışlık Buğday + Soya', 'Kışlık Bakla'],
      reason: 'Ekim yağışları başlamadan hasadı bitirir ve 2 sulama turu tasarruf sağlar.',
      soilImpact: 'Tuzluluk yıkanması & azot dengesi'
    },
    alt2: {
      badge: 'ALTERNATİF STRATEJİ 2',
      title: 'Su Tasarruflu Pamuk + Yerfıstığı / Fiğ Rotasyonu',
      subtitle: 'Ağır Toprak Havalandırma Planı',
      plantingWindow: '3–14 Nisan (-21 Gün)',
      sequence: ['Erkenci Hibrit Pamuk', 'Yerfıstığı / Soya', 'Kışlık Macar Fiği'],
      reason: 'Killi topraklarda geçirgenliği artırır ve mantar solgunluğunu %75 azaltır.',
      soilImpact: 'Yüksek organik karbon & drenaj'
    }
  },
  seker_pancari: {
    label: 'Şeker Pancarı',
    baseRevenuePerDekar: 9200,
    baseline: {
      badge: 'MEVCUT PLAN',
      title: 'Nisan Ortası Standart Pancar Ekimi',
      subtitle: 'Yüksek Cercospora Yaprak Lekesi Riski',
      plantingWindow: '10–25 Nisan',
      sequence: ['Şeker Pancarı', 'Buğday', 'Şeker Pancarı'],
      reason: 'Sık pancar ekimi toprakta nematod ve rizomani hastalığını tetikler.',
      soilImpact: 'Kök nematodu & potasyum tüketimi'
    },
    alt1: {
      badge: 'ÖNERİLEN STRATEJİ 1',
      title: 'Rizomani Dirençli Yüksek Polar + 3\'lü Tahıl/Baklagil',
      subtitle: '24 Gün Erken Ekim (+%1.8 Polar)',
      plantingWindow: '16–28 Mart (-24 Gün)',
      sequence: ['Cercospora Dirençli Pancar', 'Erkenci Arpa', 'Nohut / Kuru Fasulye'],
      reason: 'Erken gelişimle yaz sıcağından önce toprağı gölgeler; yaprak yanıklığını ve mantarı durdurur.',
      soilImpact: 'Nematod bariyeri & yüksek şeker verimi'
    },
    alt2: {
      badge: 'ALTERNATİF STRATEJİ 2',
      title: 'Erkenci Yüksek Polar + Kışlık Fiğ Ara Ürünü',
      subtitle: 'Düşük Azot & Su Maliyetli Plan',
      plantingWindow: '14–25 Mart (-26 Gün)',
      sequence: ['Yüksek Polar Pancar', 'Kışlık Macar Fiği', 'Ekmeklik Buğday'],
      reason: 'Toprak strüktürünü kabartarak kök gelişimini hızlandırır ve sulama ihtiyacını azaltır.',
      soilImpact: 'Gevşek kök yatağı & nem tutulumu'
    }
  }
};