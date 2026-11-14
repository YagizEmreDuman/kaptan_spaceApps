const SOIL_HINTS = {
  tinli: 'Dengeli nem tutulumu',
  killi: 'Yüksek nem -> Mantar riski artar',
  kumlu: 'Hızlı su kaybı -> Kuraklık riski',
  kirecli: 'Yüksek pH -> Mikro besin kilidi'
};

export function initFormManager(onSubmitCallback) {
  const form = document.getElementById('advisor-form');
  const quickDemoBtn = document.getElementById('quick-demo-btn');
  const soilHintEl = document.getElementById('soil-risk-hint');

  // Toprak tipi seçildikçe üstteki ipucunu güncelle
  document.querySelectorAll('input[name="soilType"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      if (soilHintEl && SOIL_HINTS[e.target.value]) {
        soilHintEl.textContent = SOIL_HINTS[e.target.value];
      }
    });
  });

  function collectFormPayload() {
    const region = document.getElementById('region')?.value || 'konya';
    const latitude = parseFloat(document.getElementById('lat-input')?.value) || 37.8746;
    const longitude = parseFloat(document.getElementById('lng-input')?.value) || 32.4932;

    const soilType = document.querySelector('input[name="soilType"]:checked')?.value || 'tinli';
    const soilPh = document.getElementById('soil-ph')?.value || 'notr';
    const areaDekar = Math.max(1, Number(document.getElementById('field-area')?.value) || 120);

    const targetCrop = document.getElementById('target-crop')?.value || 'bugday';
    const irrigation = document.getElementById('irrigation')?.value || 'damla_sulama';
    const budgetLevel = document.querySelector('input[name="budgetLevel"]:checked')?.value || 'orta';

    const machinery = Array.from(document.querySelectorAll('input[name="machinery"]:checked')).map(
      (chk) => chk.value
    );

    return {
      location: { region, latitude, longitude },
      soil: { type: soilType, ph: soilPh, areaDekar },
      cropAndResources: { targetCrop, irrigation, budgetLevel, machinery },
      simOverrides: { rainDeltaPct: 0, humidityIncrease: 0 }
    };
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (typeof onSubmitCallback === 'function') {
        onSubmitCallback(collectFormPayload());
      }
    });
  }

  if (quickDemoBtn) {
    quickDemoBtn.addEventListener('click', () => {
      if (typeof onSubmitCallback === 'function') {
        onSubmitCallback(collectFormPayload());
      }
    });
  }
}