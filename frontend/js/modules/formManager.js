import { SOIL_HINTS } from '../data/climateData.js';

export function initFormManager(onAnalyzeCallback) {
  const advisorForm = document.getElementById('advisor-form');
  const soilRiskHint = document.getElementById('soil-risk-hint');
  const quickDemoBtn = document.getElementById('quick-demo-btn');

  document.querySelectorAll('input[name="soilType"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const hint = SOIL_HINTS[e.target.value];
      if (hint) {
        soilRiskHint.textContent = hint.text;
        soilRiskHint.className = `text-[10px] font-medium ${hint.color}`;
      }
    });
  });

  function getPayload() {
    const formData = new FormData(advisorForm);
    return {
      location: {
        region: formData.get('region'),
        latitude: parseFloat(formData.get('latitude')),
        longitude: parseFloat(formData.get('longitude'))
      },
      soil: {
        type: formData.get('soilType'),
        ph: formData.get('soilPh'),
        areaDekar: Number(formData.get('fieldArea'))
      },
      cropAndResources: {
        targetCrop: formData.get('targetCrop'),
        irrigation: formData.get('irrigation'),
        budgetLevel: formData.get('budgetLevel'),
        machinery: formData.getAll('machinery')
      }
    };
  }

  advisorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    onAnalyzeCallback(getPayload());
  });

  quickDemoBtn.addEventListener('click', () => {
    onAnalyzeCallback(getPayload());
  });
}