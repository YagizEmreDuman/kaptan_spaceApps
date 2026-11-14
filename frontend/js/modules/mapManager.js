export function initMapManager() {
  const initialLat = 37.8746;
  const initialLng = 32.4932;

  const map = L.map('field-map', { zoomControl: true }).setView([initialLat, initialLng], 7);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 18
  }).addTo(map);

  const radarIcon = L.divIcon({
    className: 'custom-div-icon',
    html: '<div class="field-radar-pin"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  const fieldMarker = L.marker([initialLat, initialLng], { icon: radarIcon }).addTo(map);

  const regionSelect = document.getElementById('region');
  const coordBadge = document.getElementById('coord-badge');
  const headerCoords = document.getElementById('header-coords');
  const latInput = document.getElementById('lat-input');
  const lngInput = document.getElementById('lng-input');
  const locateMeBtn = document.getElementById('locate-me-btn');

  function updateLocation(lat, lng, isCustomClick = false) {
    const formattedLat = Number(lat).toFixed(4);
    const formattedLng = Number(lng).toFixed(4);

    fieldMarker.setLatLng([lat, lng]);
    latInput.value = formattedLat;
    lngInput.value = formattedLng;

    coordBadge.textContent = `${formattedLat}, ${formattedLng}`;
    headerCoords.textContent = `📍 ${Number(lat).toFixed(2)}°K, ${Number(lng).toFixed(2)}°D`;

    if (isCustomClick) regionSelect.value = 'custom';
  }

  map.on('click', (e) => updateLocation(e.latlng.lat, e.latlng.lng, true));

  regionSelect.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const lat = parseFloat(selectedOption.dataset.lat);
    const lng = parseFloat(selectedOption.dataset.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 8, { duration: 1.1 });
      updateLocation(lat, lng, false);
    }
  });

  locateMeBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Tarayıcınız konum özelliğini desteklemiyor.');
    locateMeBtn.textContent = 'Bulunuyor...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 11, { duration: 1.1 });
        updateLocation(latitude, longitude, true);
        locateMeBtn.textContent = 'Konumumu Bul';
      },
      () => {
        alert('Konum izni alınamadı. Haritadan manuel seçim yapabilirsiniz.');
        locateMeBtn.textContent = 'Konumumu Bul';
      }
    );
  });
}