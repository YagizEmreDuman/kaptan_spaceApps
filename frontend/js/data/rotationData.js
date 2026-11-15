<<<<<<< HEAD
﻿// Adapt actual algorithm strategies; never fabricate gains, risk scores or dates.
export function normalizeRotationStrategies(strategies) {
  if (!Array.isArray(strategies)) return [];
  return strategies.map(strategy => ({
    ...strategy,
    title: Array.isArray(strategy.cropNames) ? strategy.cropNames.join(' → ') : '',
    sequence: Array.isArray(strategy.cropNames) ? strategy.cropNames : [],
    score: typeof strategy.indicativeSuitabilityIndex0to100 === 'number'
      ? strategy.indicativeSuitabilityIndex0to100 : null
  }));
}
=======
import { getCurrentLang } from '../modules/i18nManager.js';

const CROP_BASE_REVENUE = {
  bugday: 4200,
  misir: 6800,
  domates: 11500,
  aycicegi: 4600,
  pamuk: 8400,
  seker_pancari: 9200
};

const STRATEGY_I18N = {
  tr: {
    bugday: {
      baseline: {
        title: 'Geleneksel Monokültür Buğday',
        plantingWindow: '15–28 Ekim (Geleneksel)',
        sequence: ['Ekmeklik Buğday', 'Ekmeklik Buğday', 'Nadas / Buğday'],
        reason: 'Üst üste tahıl ekimi toprakta sarı pas ve kök çürüklüğü sporlarını biriktirir; geç ekim Haziran sıcağına yakalanır.'
      },
      alt1: {
        title: 'Erkenci Dirençli Buğday + Baklagil Rotasyonu',
        plantingWindow: '26 Eylül – 6 Ekim (-18 Gün)',
        sequence: ['Yr Dirençli Buğday', 'Nohut / Mercimek', 'Macar Fiği + Buğday'],
        reason: 'Erken ekim bitkinin bahar mantar zirvesinden önce güçlenmesini sağlar; baklagil ara sezonu toprakta doğal azot bağlar.'
      },
      alt2: {
        title: 'Kuraklık Kalkanı: Tritikale & Yağlık Ayçiçeği',
        plantingWindow: '22 Eylül – 2 Ekim (-22 Gün)',
        sequence: ['Sertifikalı Tritikale', 'Orobanş Dirençli Ayçiçeği', 'Kışlık Fiğ + Buğday'],
        reason: 'Düşük yağış projeksiyonlarında su tüketimini %35 azaltır ve farklı kök derinlikleriyle toprak katmanlarını dengeler.'
      }
    },
    misir: {
      baseline: {
        title: 'Geleneksel Geçci Dane Mısır',
        plantingWindow: '25 Nisan – 10 Mayıs',
        sequence: ['Standart Mısır', 'Standart Mısır', 'Buğday'],
        reason: 'Temmuz-Ağustos sıcak dalgası tozlaşma dönemine denk gelir; su tüketimi ve koçan yanıklığı riski yükselir.'
      },
      alt1: {
        title: 'FAO 500 Erkenci Hibrit + Kışlık Yem Bezelyesi',
        plantingWindow: '28 Mart – 8 Nisan (-25 Gün)',
        sequence: ['FAO 500 Erkenci Mısır', 'Kışlık Yem Bezelyesi', 'Ekmeklik Buğday'],
        reason: 'Tozlaşma Haziran sonunda tamamlanarak Temmuz aşırı sıcaklarından kaçar; kışlık örtü bitkisi toprak nemini kilitler.'
      },
      alt2: {
        title: 'Kuraklık Toleranslı Tane Sorgum & Soya Döngüsü',
        plantingWindow: '2–12 Nisan (-20 Gün)',
        sequence: ['Hibrit Tane Sorgum', 'İkinci Ürün Soya', 'Kışlık Arpa'],
        reason: 'Sorgum yüksek sıcaklıkta yapraklarını kıvırarak suyu korur; soya rotasyonu toprağı azotça zenginleştirir.'
      }
    },
    domates: {
      baseline: {
        title: 'Klasik Mayıs Dikimi Salçalık Domates',
        plantingWindow: '1–15 Mayıs',
        sequence: ['Salçalık Domates', 'Biber / Patlıcan', 'Salçalık Domates'],
        reason: 'Aynı familyadan bitkiler toprakta Mildiyö ve Fusarium mantarlarını kalıcı hale getirir.'
      },
      alt1: {
        title: 'Mildiyö Dirençli Hibrit + Tahıl Bariyer Ekimi',
        plantingWindow: '12–22 Nisan (-19 Gün)',
        sequence: ['Dirençli Salçalık Hibrit', 'Kışlık Ekmeklik Buğday', 'Oturak Kuru Fasulye'],
        reason: 'Tahıl ara sezonu mantar sporlarının kışlamasını durdurur; erken dikim Ağustos güneş yanığını azaltır.'
      },
      alt2: {
        title: 'Erkenci Hibrit + Baklagil Yeşil Gübre Döngüsü',
        plantingWindow: '10–20 Nisan (-21 Gün)',
        sequence: ['Erkenci Dirençli Domates', 'Kışlık Macar Fiği', 'Tatlı Mısır / Fasulye'],
        reason: 'Fungisit ilaçlama ihtiyacını %60 azaltırken meyve tutumunu erken serin dönemde tamamlar.'
      }
    },
    aycicegi: {
      baseline: {
        title: 'Standart Yağlık Ayçiçeği - Buğday',
        plantingWindow: '15–30 Nisan',
        sequence: ['Standart Ayçiçeği', 'Buğday', 'Standart Ayçiçeği'],
        reason: 'Sık ayçiçeği dönüşü Orobanş paraziti ve köse (mildiyö) riskini artırır.'
      },
      alt1: {
        title: 'Yüksek Oleik Dirençli Ayçiçeği + Nohut',
        plantingWindow: '22 Mart – 3 Nisan (-23 Gün)',
        sequence: ['Orobanş Dirençli Ayçiçeği', 'Kuraklığa Dayanıklı Nohut', 'Sertifikalı Buğday'],
        reason: 'Kış sonu nemiyle derin kazık kök geliştirir; nohut ara ürünü parazit döngüsünü tamamen kırar.'
      },
      alt2: {
        title: 'Erkenci Hibrit + Kışlık Yulaf Malç Sistemi',
        plantingWindow: '20–31 Mart (-25 Gün)',
        sequence: ['Erkenci Yüksek Oleik', 'Kışlık Yulaf Örtüsü', 'Mercimek / Arpa'],
        reason: 'Bahar rüzgarlarının yüzey nemini uçurmasını önleyerek yağışsız yazlarda bile tabla dolumu sağlar.'
      }
    },
    pamuk: {
      baseline: {
        title: 'Geleneksel Monokültür Pamuk',
        plantingWindow: '25 Nisan – 10 Mayıs',
        sequence: ['Standart Pamuk', 'Standart Pamuk', 'Standart Pamuk'],
        reason: 'Geç hasat Ekim yağışlarına yakalanarak koza çürüklüğü ve lif kalitesi kaybına yol açar.'
      },
      alt1: {
        title: 'Erkenci Solgunluk Dirençli Pamuk + Buğday/Soya',
        plantingWindow: '5–16 Nisan (-19 Gün)',
        sequence: ['Verticillium Dirençli Pamuk', 'Kışlık Buğday + Soya', 'Kışlık Bakla'],
        reason: 'Ekim yağışları başlamadan hasadı bitirir ve 2 sulama turu tasarruf sağlar.'
      },
      alt2: {
        title: 'Su Tasarruflu Pamuk + Yerfıstığı / Fiğ Rotasyonu',
        plantingWindow: '3–14 Nisan (-21 Gün)',
        sequence: ['Erkenci Hibrit Pamuk', 'Yerfıstığı / Soya', 'Kışlık Macar Fiği'],
        reason: 'Killi topraklarda geçirgenliği artırır ve mantar solgunluğunu %75 azaltır.'
      }
    },
    seker_pancari: {
      baseline: {
        title: 'Nisan Ortası Standart Pancar Ekimi',
        plantingWindow: '10–25 Nisan',
        sequence: ['Şeker Pancarı', 'Buğday', 'Şeker Pancarı'],
        reason: 'Sık pancar ekimi toprakta nematod ve rizomani hastalığını tetikler.'
      },
      alt1: {
        title: 'Rizomani Dirençli Yüksek Polar + 3\'lü Tahıl/Baklagil',
        plantingWindow: '16–28 Mart (-24 Gün)',
        sequence: ['Cercospora Dirençli Pancar', 'Erkenci Arpa', 'Nohut / Kuru Fasulye'],
        reason: 'Erken gelişimle yaz sıcağından önce toprağı gölgeler; yaprak yanıklığını ve mantarı durdurur.'
      },
      alt2: {
        title: 'Erkenci Yüksek Polar + Kışlık Fiğ Ara Ürünü',
        plantingWindow: '14–25 Mart (-26 Gün)',
        sequence: ['Yüksek Polar Pancar', 'Kışlık Macar Fiği', 'Ekmeklik Buğday'],
        reason: 'Toprak strüktürünü kabartarak kök gelişimini hızlandırır ve sulama ihtiyacını azaltır.'
      }
    }
  },

  en: {
    bugday: {
      baseline: {
        title: 'Conventional Monoculture Wheat',
        plantingWindow: 'Oct 15 – Oct 28 (Legacy)',
        sequence: ['Bread Wheat', 'Bread Wheat', 'Fallow / Wheat'],
        reason: 'Continuous cereal planting accumulates yellow rust and root rot spores; late sowing hits June heatwaves.'
      },
      alt1: {
        title: 'Early Resistant Wheat + Legume Rotation',
        plantingWindow: 'Sep 26 – Oct 6 (-18 Days)',
        sequence: ['Yr-Resistant Wheat', 'Chickpea / Lentil', 'Hungarian Vetch + Wheat'],
        reason: 'Early sowing strengthens crops before spring fungal peaks; legumes fix natural nitrogen in the soil.'
      },
      alt2: {
        title: 'Drought Shield: Triticale & Oil Sunflower',
        plantingWindow: 'Sep 22 – Oct 2 (-22 Days)',
        sequence: ['Certified Triticale', 'Broomrape-Resistant Sunflower', 'Winter Vetch + Wheat'],
        reason: 'Cuts water consumption by 35% in dry projections and balances soil layers with varied root depths.'
      }
    },
    misir: {
      baseline: {
        title: 'Conventional Late Grain Corn',
        plantingWindow: 'Apr 25 – May 10',
        sequence: ['Standard Corn', 'Standard Corn', 'Wheat'],
        reason: 'July–August heatwaves coincide with pollination, spiking water use and ear scorch risk.'
      },
      alt1: {
        title: 'FAO 500 Early Hybrid + Winter Field Pea',
        plantingWindow: 'Mar 28 – Apr 8 (-25 Days)',
        sequence: ['FAO 500 Early Corn', 'Winter Field Pea', 'Bread Wheat'],
        reason: 'Pollination finishes by late June, avoiding extreme July heat; winter cover locks in soil moisture.'
      },
      alt2: {
        title: 'Drought-Tolerant Grain Sorghum & Soybean Cycle',
        plantingWindow: 'Apr 2 – Apr 12 (-20 Days)',
        sequence: ['Hybrid Grain Sorghum', 'Second-Crop Soybean', 'Winter Barley'],
        reason: 'Sorghum curls leaves under heat to conserve water while soybean rotation enriches soil nitrogen.'
      }
    },
    domates: {
      baseline: {
        title: 'Classic May-Planted Processing Tomato',
        plantingWindow: 'May 1 – May 15',
        sequence: ['Processing Tomato', 'Pepper / Eggplant', 'Processing Tomato'],
        reason: 'Same-family crops build up persistent Downy Mildew and Fusarium fungi in the soil.'
      },
      alt1: {
        title: 'Mildew-Resistant Hybrid + Cereal Barrier',
        plantingWindow: 'Apr 12 – Apr 22 (-19 Days)',
        sequence: ['Resistant Processing Hybrid', 'Winter Bread Wheat', 'Bush Dry Bean'],
        reason: 'A cereal break season halts fungal spore overwintering; early planting reduces August sunscald.'
      },
      alt2: {
        title: 'Early Hybrid + Legume Green Manure Cycle',
        plantingWindow: 'Apr 10 – Apr 20 (-21 Days)',
        sequence: ['Early Resistant Tomato', 'Winter Hungarian Vetch', 'Sweet Corn / Bean'],
        reason: 'Reduces fungicide spraying needs by 60% while completing fruit set in cooler early weather.'
      }
    },
    aycicegi: {
      baseline: {
        title: 'Standard Oil Sunflower - Wheat',
        plantingWindow: 'Apr 15 – Apr 30',
        sequence: ['Standard Sunflower', 'Wheat', 'Standard Sunflower'],
        reason: 'Tight sunflower rotations increase Broomrape parasite and downy mildew pressure.'
      },
      alt1: {
        title: 'High-Oleic Resistant Sunflower + Chickpea',
        plantingWindow: 'Mar 22 – Apr 3 (-23 Days)',
        sequence: ['Broomrape-Resistant Sunflower', 'Drought-Tolerant Chickpea', 'Certified Wheat'],
        reason: 'Develops deep taproots using late-winter moisture; chickpea completely breaks the parasite cycle.'
      },
      alt2: {
        title: 'Early Hybrid + Winter Oat Mulch System',
        plantingWindow: 'Mar 20 – Mar 31 (-25 Days)',
        sequence: ['Early High-Oleic', 'Winter Oat Cover', 'Lentil / Barley'],
        reason: 'Prevents spring winds from stripping surface moisture, ensuring full head development in dry summers.'
      }
    },
    pamuk: {
      baseline: {
        title: 'Conventional Monoculture Cotton',
        plantingWindow: 'Apr 25 – May 10',
        sequence: ['Standard Cotton', 'Standard Cotton', 'Standard Cotton'],
        reason: 'Late harvest gets caught in October rains, causing boll rot and fiber quality loss.'
      },
      alt1: {
        title: 'Early Wilt-Resistant Cotton + Wheat/Soybean',
        plantingWindow: 'Apr 5 – Apr 16 (-19 Days)',
        sequence: ['Verticillium-Resistant Cotton', 'Winter Wheat + Soybean', 'Winter Faba Bean'],
        reason: 'Completes harvest before October rains begin and saves 2 full irrigation rounds.'
      },
      alt2: {
        title: 'Water-Saving Cotton + Peanut / Vetch Rotation',
        plantingWindow: 'Apr 3 – Apr 14 (-21 Days)',
        sequence: ['Early Hybrid Cotton', 'Peanut / Soybean', 'Winter Hungarian Vetch'],
        reason: 'Improves permeability in heavy soils and cuts fungal wilt incidence by 75%.'
      }
    },
    seker_pancari: {
      baseline: {
        title: 'Mid-April Standard Sugar Beet',
        plantingWindow: 'Apr 10 – Apr 25',
        sequence: ['Sugar Beet', 'Wheat', 'Sugar Beet'],
        reason: 'Frequent beet planting triggers root nematodes and rhizomania disease in the soil.'
      },
      alt1: {
        title: 'Rhizomania-Resistant High-Polar + 3-Crop Cycle',
        plantingWindow: 'Mar 16 – Mar 28 (-24 Days)',
        sequence: ['Cercospora-Resistant Beet', 'Early Barley', 'Chickpea / Dry Bean'],
        reason: 'Early canopy growth shades the soil before summer heat, stopping leaf spot and fungal spread.'
      },
      alt2: {
        title: 'Early High-Polar + Winter Vetch Intercrop',
        plantingWindow: 'Mar 14 – Mar 25 (-26 Days)',
        sequence: ['High-Polar Beet', 'Winter Hungarian Vetch', 'Bread Wheat'],
        reason: 'Loosens soil structure for rapid taproot growth and lowers summer irrigation demand.'
      }
    }
  },

  es: {
    bugday: {
      baseline: {
        title: 'Monocultivo Tradicional de Trigo',
        plantingWindow: '15–28 Oct (Clásico)',
        sequence: ['Trigo Panificable', 'Trigo Panificable', 'Barbecho / Trigo'],
        reason: 'El cultivo continuo de cereal acumula roya amarilla y pudrición radicular; la siembra tardía sufre el calor de junio.'
      },
      alt1: {
        title: 'Trigo Precoz Resistente + Rotación Leguminosa',
        plantingWindow: '26 Sep – 6 Oct (-18 Días)',
        sequence: ['Trigo Resistente Yr', 'Garbanzo / Lenteja', 'Veza Húngara + Trigo'],
        reason: 'La siembra temprana fortalece el cultivo antes del pico fúngico primaveral y fija nitrógeno natural.'
      },
      alt2: {
        title: 'Escudo Sequía: Triticale y Girasol Oleico',
        plantingWindow: '22 Sep – 2 Oct (-22 Días)',
        sequence: ['Triticale Certificado', 'Girasol Resistente Jopo', 'Veza Invernal + Trigo'],
        reason: 'Reduce el consumo hídrico un 35% en escenarios secos y equilibra las capas del suelo.'
      }
    },
    misir: {
      baseline: {
        title: 'Maíz en Grano Tardío Convencional',
        plantingWindow: '25 Abr – 10 May',
        sequence: ['Maíz Estándar', 'Maíz Estándar', 'Trigo'],
        reason: 'Las olas de calor de julio-agosto coinciden con la polinización y disparan el consumo de agua.'
      },
      alt1: {
        title: 'Híbrido Precoz FAO 500 + Guisante Invernal',
        plantingWindow: '28 Mar – 8 Abr (-25 Días)',
        sequence: ['Maíz Precoz FAO 500', 'Guisante Forrajero', 'Trigo Panificable'],
        reason: 'Completa la polinización a finales de junio evitando el calor extremo y reteniendo humedad.'
      },
      alt2: {
        title: 'Sorgo Granífero Tolerante a Sequía y Soja',
        plantingWindow: '2–12 Abr (-20 Días)',
        sequence: ['Sorgo Híbrido', 'Soja Segunda Cosecha', 'Cebada Invernal'],
        reason: 'El sorgo conserva agua bajo calor extremo y la soja enriquece el suelo con nitrógeno.'
      }
    },
    domates: {
      baseline: {
        title: 'Tomate Industrial de Mayo Clásico',
        plantingWindow: '1–15 May',
        sequence: ['Tomate Industrial', 'Pimiento / Berenjena', 'Tomate Industrial'],
        reason: 'Cultivos de la misma familia perpetúan Mildiu y Fusarium en el suelo.'
      },
      alt1: {
        title: 'Híbrido Resistente a Mildiu + Barrera Cereal',
        plantingWindow: '12–22 Abr (-19 Días)',
        sequence: ['Híbrido Resistente', 'Trigo Invernal', 'Judía Seca'],
        reason: 'El cereal interrumpe la hibernación de esporas fúngicas y evita quemaduras solares en agosto.'
      },
      alt2: {
        title: 'Híbrido Precoz + Abono Verde de Leguminosa',
        plantingWindow: '10–20 Abr (-21 Días)',
        sequence: ['Tomate Precoz Resistente', 'Veza Húngara', 'Maíz Dulce / Judía'],
        reason: 'Reduce un 60% la necesidad de fungicidas al cuajar frutos en clima más fresco.'
      }
    },
    aycicegi: {
      baseline: {
        title: 'Girasol Estándar - Trigo',
        plantingWindow: '15–30 Abr',
        sequence: ['Girasol Estándar', 'Trigo', 'Girasol Estándar'],
        reason: 'La rotación corta favorece el parásito Orobanche (jopo) y el mildiu.'
      },
      alt1: {
        title: 'Girasol Alto Oleico Resistente + Garbanzo',
        plantingWindow: '22 Mar – 3 Abr (-23 Días)',
        sequence: ['Girasol Resistente', 'Garbanzo Tolerante Sequía', 'Trigo Certificado'],
        reason: 'Desarrolla raíz pivotante profunda con humedad invernal y corta el ciclo parasitario.'
      },
      alt2: {
        title: 'Híbrido Precoz + Cobertura de Avena Invernal',
        plantingWindow: '20–31 Mar (-25 Días)',
        sequence: ['Alto Oleico Precoz', 'Cobertura Avena', 'Lenteja / Cebada'],
        reason: 'Protege la humedad superficial frente al viento primaveral asegurando el llenado.'
      }
    },
    pamuk: {
      baseline: {
        title: 'Monocultivo Convencional de Algodón',
        plantingWindow: '25 Abr – 10 May',
        sequence: ['Algodón Estándar', 'Algodón Estándar', 'Algodón Estándar'],
        reason: 'La cosecha tardía coincide con lluvias de octubre dañando la calidad de la fibra.'
      },
      alt1: {
        title: 'Algodón Precoz Resistente + Trigo/Soja',
        plantingWindow: '5–16 Abr (-19 Días)',
        sequence: ['Algodón Resistente Verticillium', 'Trigo + Soja', 'Haba Invernal'],
        reason: 'Finaliza la cosecha antes de las lluvias otoñales y ahorra 2 turnos de riego.'
      },
      alt2: {
        title: 'Algodón Eficiente + Cacahuete / Veza',
        plantingWindow: '3–14 Abr (-21 Días)',
        sequence: ['Algodón Híbrido Precoz', 'Cacahuete / Soja', 'Veza Húngara'],
        reason: 'Mejora la aireación en suelos pesados y reduce la marchitez fúngica un 75%.'
      }
    },
    seker_pancari: {
      baseline: {
        title: 'Remolacha Estándar de Abril',
        plantingWindow: '10–25 Abr',
        sequence: ['Remolacha Azucarera', 'Trigo', 'Remolacha Azucarera'],
        reason: 'La repetición frecuente activa nematodos radiculares y rizomanía.'
      },
      alt1: {
        title: 'Alta Polaridad Resistente + Ciclo Triple',
        plantingWindow: '16–28 Mar (-24 Días)',
        sequence: ['Remolacha Resistente Cercospora', 'Cebada Precoz', 'Garbanzo / Judía'],
        reason: 'Cubre el suelo antes del calor estival frenando manchas foliares y hongos.'
      },
      alt2: {
        title: 'Alta Polaridad Precoz + Veza Invernal',
        plantingWindow: '14–25 Mar (-26 Días)',
        sequence: ['Remolacha Alta Polaridad', 'Veza Húngara', 'Trigo Panificable'],
        reason: 'Mullido natural del suelo para rápido desarrollo radicular y menor riego.'
      }
    }
  },

  pt: {
    bugday: {
      baseline: {
        title: 'Monocultivo Tradicional de Trigo',
        plantingWindow: '15–28 Out (Clássico)',
        sequence: ['Trigo Panificável', 'Trigo Panificável', 'Pousio / Trigo'],
        reason: 'O plantio contínuo de cereais acumula ferrugem amarela e podridão radicular; o plantio tardio sofre calor extremo.'
      },
      alt1: {
        title: 'Trigo Precoce Resistente + Leguminosa',
        plantingWindow: '26 Set – 6 Out (-18 Dias)',
        sequence: ['Trigo Resistente Yr', 'Grão-de-bico / Lentilha', 'Ervilhaca + Trigo'],
        reason: 'O plantio antecipado fortalece a lavoura antes do pico fúngico e fixa nitrogênio natural.'
      },
      alt2: {
        title: 'Escudo Seca: Triticale e Girassol Oleico',
        plantingWindow: '22 Set – 2 Out (-22 Dias)',
        sequence: ['Triticale Certificado', 'Girassol Resistente', 'Ervilhaca + Trigo'],
        reason: 'Reduz o consumo hídrico em 35% em cenários secos e equilibra as camadas do solo.'
      }
    },
    misir: {
      baseline: {
        title: 'Milho Grão Tardio Convencional',
        plantingWindow: '25 Abr – 10 Mai',
        sequence: ['Milho Padrão', 'Milho Padrão', 'Trigo'],
        reason: 'Ondas de calor coincidem com a polinização e elevam o estresse hídrico.'
      },
      alt1: {
        title: 'Híbrido Precoce FAO 500 + Ervilha Forrageira',
        plantingWindow: '28 Mar – 8 Abr (-25 Dias)',
        sequence: ['Milho Precoce FAO 500', 'Ervilha Forrageira', 'Trigo Panificável'],
        reason: 'Conclui a polinização antes do pico de calor e preserva a umidade do solo.'
      },
      alt2: {
        title: 'Sorgo Granífero Tolerante à Seca e Soja',
        plantingWindow: '2–12 Abr (-20 Dias)',
        sequence: ['Sorgo Híbrido', 'Soja Segunda Safra', 'Cevada Invernal'],
        reason: 'O sorgo conserva água sob calor intenso e a soja enriquece o solo com nitrogênio.'
      }
    },
    domates: {
      baseline: {
        title: 'Tomate Industrial Clássico de Maio',
        plantingWindow: '1–15 Mai',
        sequence: ['Tomate Industrial', 'Pimentão / Berinjela', 'Tomate Industrial'],
        reason: 'Culturas da mesma família perpetuam Míldio e Fusarium no solo.'
      },
      alt1: {
        title: 'Híbrido Resistente + Barreira de Cereal',
        plantingWindow: '12–22 Abr (-19 Dias)',
        sequence: ['Híbrido Resistente', 'Trigo Invernal', 'Feijão Comum'],
        reason: 'O cereal interrompe esporos fúngicos no solo e reduz escaldadura solar.'
      },
      alt2: {
        title: 'Híbrido Precoce + Adubo Verde Leguminoso',
        plantingWindow: '10–20 Abr (-21 Dias)',
        sequence: ['Tomate Precoce Resistente', 'Ervilhaca Húngara', 'Milho Doce / Feijão'],
        reason: 'Reduz em 60% a necessidade de fungicidas com pegamento de frutos mais cedo.'
      }
    },
    aycicegi: {
      baseline: {
        title: 'Girassol Padrão - Trigo',
        plantingWindow: '15–30 Abr',
        sequence: ['Girassol Padrão', 'Trigo', 'Girassol Padrão'],
        reason: 'A rotação curta favorece parasitas radiculares e míldio.'
      },
      alt1: {
        title: 'Girassol Alto Oleico + Grão-de-bico',
        plantingWindow: '22 Mar – 3 Abr (-23 Dias)',
        sequence: ['Girassol Resistente', 'Grão-de-bico', 'Trigo Certificado'],
        reason: 'Desenvolve raiz pivotante profunda e quebra o ciclo de parasitas.'
      },
      alt2: {
        title: 'Híbrido Precoce + Cobertura de Aveia',
        plantingWindow: '20–31 Mar (-25 Dias)',
        sequence: ['Alto Oleico Precoce', 'Cobertura de Aveia', 'Lentilha / Cevada'],
        reason: 'Protege a umidade superficial garantindo enchimento de aquênios.'
      }
    },
    pamuk: {
      baseline: {
        title: 'Monocultivo Convencional de Algodão',
        plantingWindow: '25 Abr – 10 Mai',
        sequence: ['Algodão Padrão', 'Algodão Padrão', 'Algodão Padrão'],
        reason: 'Colheita tardia enfrenta chuvas prejudicando a qualidade da pluma.'
      },
      alt1: {
        title: 'Algodão Precoce Resistente + Trigo/Soja',
        plantingWindow: '5–16 Abr (-19 Dias)',
        sequence: ['Algodão Resistente', 'Trigo + Soja', 'Fava Invernal'],
        reason: 'Antecipa a colheita antes das chuvas e economiza 2 turnos de irrigação.'
      },
      alt2: {
        title: 'Algodão Eficiente + Amendoim / Ervilhaca',
        plantingWindow: '3–14 Abr (-21 Dias)',
        sequence: ['Algodão Híbrido Precoce', 'Amendoim / Soja', 'Ervilhaca Húngara'],
        reason: 'Melhora a aeração do solo e reduz murcha fúngica em 75%.'
      }
    },
    seker_pancari: {
      baseline: {
        title: 'Beterraba Padrão de Abril',
        plantingWindow: '10–25 Abr',
        sequence: ['Beterraba Sacarina', 'Trigo', 'Beterraba Sacarina'],
        reason: 'Repetição frequente ativa nematoides e rizomania no solo.'
      },
      alt1: {
        title: 'Alta Polaridade Resistente + Ciclo Triplo',
        plantingWindow: '16–28 Mar (-24 Dias)',
        sequence: ['Beterraba Resistente', 'Cevada Precoce', 'Grão-de-bico / Feijão'],
        reason: 'Cobre o solo antes do calor intenso freando manchas foliares.'
      },
      alt2: {
        title: 'Alta Polaridade Precoce + Ervilhaca',
        plantingWindow: '14–25 Mar (-26 Dias)',
        sequence: ['Beterraba Alta Polaridade', 'Ervilhaca Húngara', 'Trigo Panificável'],
        reason: 'Estrutura o solo para rápido enraizamento e menor demanda hídrica.'
      }
    }
  },

  de: {
    bugday: {
      baseline: {
        title: 'Traditionelle Weizen-Monokultur',
        plantingWindow: '15.–28. Okt (Klassisch)',
        sequence: ['Brotweizen', 'Brotweizen', 'Brache / Weizen'],
        reason: 'Ununterbrochener Getreideanbau fördert Gelbrost und Wurzelfäule; späte Saat gerät in die Junihitze.'
      },
      alt1: {
        title: 'Frühreifer Resistenter Weizen + Leguminosen',
        plantingWindow: '26. Sep – 6. Okt (-18 Tage)',
        sequence: ['Yr-Resistenter Weizen', 'Kichererbse / Linse', 'Winterwicke + Weizen'],
        reason: 'Frühe Aussaat stärkt Bestände vor Frühjahrspilzen; Leguminosen binden natürlichen Stickstoff.'
      },
      alt2: {
        title: 'Trockenschutz: Triticale & Öl-Sonnenblume',
        plantingWindow: '22. Sep – 2. Okt (-22 Tage)',
        sequence: ['Zertifizierte Triticale', 'Resistente Sonnenblume', 'Winterwicke + Weizen'],
        reason: 'Senkt den Wasserbedarf bei Trockenheit um 35 % und schont tiefere Bodenschichten.'
      }
    },
    misir: {
      baseline: {
        title: 'Konventioneller Später Körnermais',
        plantingWindow: '25. Apr – 10. Mai',
        sequence: ['Standard-Mais', 'Standard-Mais', 'Weizen'],
        reason: 'Julihitzewellen treffen auf die Blüte und erhöhen Wasserbedarf sowie Kolbenstress.'
      },
      alt1: {
        title: 'FAO 500 Frühhybrid + Winterfuttererbse',
        plantingWindow: '28. Mär – 8. Apr (-25 Tage)',
        sequence: ['FAO 500 Frühmais', 'Winterfuttererbse', 'Brotweizen'],
        reason: 'Bestäubung endet vor der Extremhitze; Winterbegrünung speichert Bodenfeuchte.'
      },
      alt2: {
        title: 'Trockentolerante Körnerhirse & Soja-Folge',
        plantingWindow: '2.–12. Apr (-20 Tage)',
        sequence: ['Hybrid-Körnerhirse', 'Zweitfrucht Soja', 'Wintergerste'],
        reason: 'Sorghum spart bei Hitze Wasser und Soja reichert den Boden mit Stickstoff an.'
      }
    },
    domates: {
      baseline: {
        title: 'Klassische Mai-Pflanzung Industrietomate',
        plantingWindow: '1.–15. Mai',
        sequence: ['Industrietomate', 'Paprika / Aubergine', 'Industrietomate'],
        reason: 'Enge Nachtschatten-Folgen fördern Falschen Mehltau und Fusarium im Boden.'
      },
      alt1: {
        title: 'Mehltau-Resistenter Hybrid + Getreidebarriere',
        plantingWindow: '12.–22. Apr (-19 Tage)',
        sequence: ['Resistenter Hybrid', 'Winterweizen', 'Buschbohne'],
        reason: 'Getreide unterbricht Pilzsporen im Boden; frühe Pflanzung mindert Sonnenbrand.'
      },
      alt2: {
        title: 'Frühhybrid + Leguminosen-Gründüngung',
        plantingWindow: '10.–20. Apr (-21 Tage)',
        sequence: ['Frühe Resistente Tomate', 'Winterwicke', 'Zuckermais / Bohne'],
        reason: 'Reduziert Fungizideinsatz um 60 % durch Fruchtansatz in kühlerer Witterung.'
      }
    },
    aycicegi: {
      baseline: {
        title: 'Standard Öl-Sonnenblume - Weizen',
        plantingWindow: '15.–30. Apr',
        sequence: ['Standard-Sonnenblume', 'Weizen', 'Standard-Sonnenblume'],
        reason: 'Enge Sonnenblumenfolgen erhöhen das Risiko für Sommerwurz und Mehltau.'
      },
      alt1: {
        title: 'High-Oleic Resistente Sonnenblume + Kichererbse',
        plantingWindow: '22. Mär – 3. Apr (-23 Tage)',
        sequence: ['Resistente Sonnenblume', 'Trockentolerante Kichererbse', 'Zertifizierter Weizen'],
        reason: 'Bildet tiefe Pfahlwurzeln mit Winterfeuchte und durchbricht Parasitenzyklen.'
      },
      alt2: {
        title: 'Frühhybrid + Winterhafer-Mulchsystem',
        plantingWindow: '20.–31. Mär (-25 Tage)',
        sequence: ['Frühe High-Oleic', 'Winterhafer-Mulch', 'Linse / Gerste'],
        reason: 'Schützt Bodenfeuchte vor Frühjahrswinden für volle Kornausbildung.'
      }
    },
    pamuk: {
      baseline: {
        title: 'Konventionelle Baumwoll-Monokultur',
        plantingWindow: '25. Apr – 10. Mai',
        sequence: ['Standard-Baumwolle', 'Standard-Baumwolle', 'Standard-Baumwolle'],
        reason: 'Späte Ernte gerät in Herbstregen und mindert die Faserqualität.'
      },
      alt1: {
        title: 'Frühe Welkeresistente Baumwolle + Weizen/Soja',
        plantingWindow: '5.–16. Apr (-19 Tage)',
        sequence: ['Verticillium-Resistente Sorte', 'Winterweizen + Soja', 'Winterackerbohne'],
        reason: 'Schließt die Ernte vor Herbstregen ab und spart 2 Bewässerungsgänge.'
      },
      alt2: {
        title: 'Wassersparende Baumwolle + Erdnuss / Wicke',
        plantingWindow: '3.–14. Apr (-21 Tage)',
        sequence: ['Früher Hybrid', 'Erdnuss / Soja', 'Winterwicke'],
        reason: 'Verbessert die Bodendurchlüftung und senkt Welkepilze um 75 %.'
      }
    },
    seker_pancari: {
      baseline: {
        title: 'Standard-Zuckerrübe Mitte April',
        plantingWindow: '10.–25. Apr',
        sequence: ['Zuckerrübe', 'Weizen', 'Zuckerrübe'],
        reason: 'Häufiger Rübenanbau fördert Nematoden und Rizomania im Boden.'
      },
      alt1: {
        title: 'Rizomania-Resistente Sorte + 3er-Fruchtfolge',
        plantingWindow: '16.–28. Mär (-24 Tage)',
        sequence: ['Cercospora-Resistente Rübe', 'Frühgerste', 'Kichererbse / Bohne'],
        reason: 'Früher Bestandesschluss beschattet den Boden vor Sommerhitze.'
      },
      alt2: {
        title: 'Frühe High-Polar + Winterwicke Zwischenfrucht',
        plantingWindow: '14.–25. Mär (-26 Tage)',
        sequence: ['High-Polar Rübe', 'Winterwicke', 'Brotweizen'],
        reason: 'Lockert die Bodenstruktur für schnelles Wurzelwachstum und spart Wasser.'
      }
    }
  },

  nl: {
    bugday: {
      baseline: {
        title: 'Traditionele Tarwe-monocultuur',
        plantingWindow: '15–28 Okt (Klassiek)',
        sequence: ['Broodtarwe', 'Broodtarwe', 'Braak / Tarwe'],
        reason: 'Continue graanteelt hoopt gele roest en wortelrot op; late zaai lijdt onder junihitte.'
      },
      alt1: {
        title: 'Vroege Resistente Tarwe + Vlinderbloemigen',
        plantingWindow: '26 Sep – 6 Okt (-18 Dagen)',
        sequence: ['Yr-Resistente Tarwe', 'Kikkererwt / Linze', 'Winterwikke + Tarwe'],
        reason: 'Vroeg zaaien versterkt het gewas vóór voorjaarsschimmels en bindt natuurlijke stikstof.'
      },
      alt2: {
        title: 'Droogteschild: Triticale & Oliezonnebloem',
        plantingWindow: '22 Sep – 2 Okt (-22 Dagen)',
        sequence: ['Gecertificeerde Triticale', 'Resistente Zonnebloem', 'Winterwikke + Tarwe'],
        reason: 'Verlaagt waterverbruik met 35% bij droogte en balanceert bodemlagen.'
      }
    },
    misir: {
      baseline: {
        title: 'Conventionele Late Korrelmaïs',
        plantingWindow: '25 Apr – 10 Mei',
        sequence: ['Standaard Maïs', 'Standaard Maïs', 'Tarwe'],
        reason: 'Zomerhittegolven vallen samen met de bloei en verhogen waterstress.'
      },
      alt1: {
        title: 'FAO 500 Vroege Hybride + Wintervoedererwt',
        plantingWindow: '28 Mrt – 8 Apr (-25 Dagen)',
        sequence: ['FAO 500 Vroege Maïs', 'Wintervoedererwt', 'Broodtarwe'],
        reason: 'Bestuiving eindigt vóór extreme hitte; winterdekking houdt bodemvocht vast.'
      },
      alt2: {
        title: 'Droogtetolerante Sorghum & Soja-rotatie',
        plantingWindow: '2–12 Apr (-20 Dagen)',
        sequence: ['Hybride Sorghum', 'Tweede Teelt Soja', 'Wintergerst'],
        reason: 'Sorghum bespaart water bij hitte en soja verrijkt de bodem met stikstof.'
      }
    },
    domates: {
      baseline: {
        title: 'Klassieke Mei-planting Industrietomaat',
        plantingWindow: '1–15 Mei',
        sequence: ['Industrietomaat', 'Paprika / Aubergine', 'Industrietomaat'],
        reason: 'Nauwe nachtschaderotatie houdt valse meeldauw en Fusarium in stand.'
      },
      alt1: {
        title: 'Meeldauwresistente Hybride + Graanbarrière',
        plantingWindow: '12–22 Apr (-19 Dagen)',
        sequence: ['Resistente Hybride', 'Wintertarwe', 'Stamboon'],
        reason: 'Graan doorbreekt schimmelsporen in de bodem; vroeg planten voorkomt zonnebrand.'
      },
      alt2: {
        title: 'Vroege Hybride + Groenbemester Rotatie',
        plantingWindow: '10–20 Apr (-21 Dagen)',
        sequence: ['Vroege Resistente Tomaat', 'Winterwikke', 'Suikermaïs / Boon'],
        reason: 'Verlaagt fungicidenbehoefte met 60% door vruchtzetting in koeler weer.'
      }
    },
    aycicegi: {
      baseline: {
        title: 'Standaard Oliezonnebloem - Tarwe',
        plantingWindow: '15–30 Apr',
        sequence: ['Standaard Zonnebloem', 'Tarwe', 'Standaard Zonnebloem'],
        reason: 'Korte rotatie verhoogt het risico op bremraap en valse meeldauw.'
      },
      alt1: {
        title: 'High-Oleic Resistente Zonnebloem + Kikkererwt',
        plantingWindow: '22 Mrt – 3 Apr (-23 Dagen)',
        sequence: ['Resistente Zonnebloem', 'Droogtetolerante Kikkererwt', 'Gecertificeerde Tarwe'],
        reason: 'Ontwikkelt diepe penwortels met wintervocht en doorbreekt parasietcycli.'
      },
      alt2: {
        title: 'Vroege Hybride + Winterhaver Mulchsysteem',
        plantingWindow: '20–31 Mrt (-25 Dagen)',
        sequence: ['Vroege High-Oleic', 'Winterhaver Dekgewas', 'Linze / Gerst'],
        reason: 'Beschermt bodemvocht tegen voorjaarswind voor optimale korrelvulling.'
      }
    },
    pamuk: {
      baseline: {
        title: 'Conventionele Katoen-monocultuur',
        plantingWindow: '25 Apr – 10 Mei',
        sequence: ['Standaard Katoen', 'Standaard Katoen', 'Standaard Katoen'],
        reason: 'Late oogst raakt verzeild in herfstregens met kwaliteitsverlies tot gevolg.'
      },
      alt1: {
        title: 'Vroege Verwelkingsresistente Katoen + Tarwe/Soja',
        plantingWindow: '5–16 Apr (-19 Dagen)',
        sequence: ['Verticillium-Resistente Katoen', 'Wintertarwe + Soja', 'Winterveldboon'],
        reason: 'Oogst vóór herfstregens en bespaart 2 irrigatierondes.'
      },
      alt2: {
        title: 'Waterbesparende Katoen + Pinda / Wikke',
        plantingWindow: '3–14 Apr (-21 Dagen)',
        sequence: ['Vroege Hybride Katoen', 'Pinda / Soja', 'Winterwikke'],
        reason: 'Verbetert bodemdoorluchting en verlaagt verwelkingsschimmel met 75%.'
      }
    },
    seker_pancari: {
      baseline: {
        title: 'Standaard Suikerbiet Half April',
        plantingWindow: '10–25 Apr',
        sequence: ['Suikerbiet', 'Tarwe', 'Suikerbiet'],
        reason: 'Frequente bietenteelt activeert aaltjes en rhizomanie in de bodem.'
      },
      alt1: {
        title: 'Rhizomanie-Resistente Biet + 3-Gewassen Cyclus',
        plantingWindow: '16–28 Mrt (-24 Dagen)',
        sequence: ['Cercospora-Resistente Biet', 'Vroege Gerst', 'Kikkererwt / Boon'],
        reason: 'Vroege bodembedekking beschermt tegen zomerhitte en bladvlekkenziekte.'
      },
      alt2: {
        title: 'Vroege High-Polar + Winterwikke Tussenteelt',
        plantingWindow: '14–25 Mrt (-26 Dagen)',
        sequence: ['High-Polar Biet', 'Winterwikke', 'Broodtarwe'],
        reason: 'Maakt de bodem los voor snelle wortelgroei en lagere waterbehoefte.'
      }
    }
  }
};

export function getCropRotationTemplate(cropKey) {
  const lang = getCurrentLang();
  const langMap = STRATEGY_I18N[lang] || STRATEGY_I18N.tr;
  const cropStrategies = langMap[cropKey] || langMap.bugday;
  const baseRevenuePerDekar = CROP_BASE_REVENUE[cropKey] || CROP_BASE_REVENUE.bugday;

  return {
    baseRevenuePerDekar,
    ...cropStrategies
  };
}
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
