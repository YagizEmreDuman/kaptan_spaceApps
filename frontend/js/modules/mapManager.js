let globalMapInstance = null;

// Harita görünür hale geldiğinde boyutunu yeniden hesaplamak için dışarı açıyoruz
export function refreshMapSize() {
  if (globalMapInstance) {
    setTimeout(() => globalMapInstance.invalidateSize(), 100);
  }
}

// Boylam değerini her zaman -180 ile +180 arasına sabitler (NASA API koruması)
function normalizeLongitude(lng) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

export function initMapManager() {
  const mapEl = document.getElementById('field-map');
  if (!mapEl || typeof L === 'undefined') return;

  const regionSelect = document.getElementById('region');
  const latInput = document.getElementById('lat-input');
  const lngInput = document.getElementById('lng-input');
  const coordBadge = document.getElementById('coord-badge');
  const headerCoords = document.getElementById('header-coords');
  const locateBtn = document.getElementById('locate-me-btn');
  const searchInput = document.getElementById('map-search-input');
  const searchBtn = document.getElementById('map-search-btn');

  const initialLat = parseFloat(latInput?.value) || 37.8746;
  const initialLng = parseFloat(lngInput?.value) || 32.4932;

  // Dünya Haritası Ayarları (Tüm kıtalar görünür, sınır dışı taşma engelli)
  const map = L.map('field-map', {
    zoomControl: true,
    attributionControl: true,
    minZoom: 2,
    maxBounds: [
      [-85, -180],
      [85, 180]
    ],
    maxBoundsViscosity: 1.0
  }).setView([22, 18], 2);

  globalMapInstance = map;

  const voyagerTiles = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      noWrap: true,
      maxZoom: 18
    }
  );

  const osmFallbackTiles = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap',
      noWrap: true,
      maxZoom: 18
    }
  );

  let fallbackActivated = false;
  voyagerTiles.on('tileerror', () => {
    if (!fallbackActivated) {
      fallbackActivated = true;
      map.removeLayer(voyagerTiles);
      osmFallbackTiles.addTo(map);
    }
  });

  voyagerTiles.addTo(map);

  const pinIcon = L.divIcon({
    className: '',
    html: '<div class="cropguard-pin"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  const marker = L.marker([initialLat, initialLng], {
    icon: pinIcon,
    draggable: true
  }).addTo(map);

  function syncCoordinates(rawLat, rawLng, { setCustomDropdown = true, fly = false, zoom = 6 } = {}) {
    const lat = Math.max(-85, Math.min(85, Number(rawLat)));
    const lng = normalizeLongitude(Number(rawLng));

    const fixedLat = lat.toFixed(4);
    const fixedLng = lng.toFixed(4);
    const latDir = lat >= 0 ? 'K' : 'G';
    const lngDir = lng >= 0 ? 'D' : 'B';

    if (latInput) latInput.value = fixedLat;
    if (lngInput) lngInput.value = fixedLng;
    if (coordBadge) coordBadge.textContent = `${fixedLat}, ${fixedLng}`;
    if (headerCoords) {
      headerCoords.textContent = `📍 ${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
    }

    marker.setLatLng([lat, lng]);
    if (fly) {
      map.flyTo([lat, lng], zoom, { duration: 0.8 });
    }

    if (setCustomDropdown && regionSelect) {
      regionSelect.value = 'custom';
      const customOpt = regionSelect.querySelector('option[value="custom"]');
      if (customOpt) {
        customOpt.dataset.lat = fixedLat;
        customOpt.dataset.lng = fixedLng;
      }
    }
  }

  // Haritaya tıklama & pin sürükleme
  map.on('click', (e) => {
    syncCoordinates(e.latlng.lat, e.latlng.lng, { setCustomDropdown: true, fly: false });
  });

  marker.on('dragend', () => {
    const pos = marker.getLatLng();
    syncCoordinates(pos.lat, pos.lng, { setCustomDropdown: true, fly: false });
  });

  // Hazır Küresel Bölge Seçici
  if (regionSelect) {
    regionSelect.addEventListener('change', () => {
      const selected = regionSelect.options[regionSelect.selectedIndex];
      const lat = parseFloat(selected.dataset.lat);
      const lng = parseFloat(selected.dataset.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        syncCoordinates(lat, lng, { setCustomDropdown: false, fly: true, zoom: 6 });
      }
    });
  }

  // Şehir / Ülke Arama (OpenStreetMap Nominatim)
  async function handleCitySearch() {
    const query = searchInput?.value?.trim();
    if (!query) return;

    const origLabel = searchBtn ? searchBtn.textContent : '';
    if (searchBtn) searchBtn.textContent = '...';

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        syncCoordinates(parseFloat(results[0].lat), parseFloat(results[0].lon), {
          setCustomDropdown: true,
          fly: true,
          zoom: 8
        });
      } else {
        alert('Konum bulunamadı. Farklı bir şehir veya ülke adı deneyin.');
      }
    } catch {
      alert('Arama servisine bağlanılamadı, haritadan doğrudan tıklayarak seçebilirsiniz.');
    } finally {
      if (searchBtn) searchBtn.textContent = origLabel;
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', handleCitySearch);
  }
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCitySearch();
      }
    });
  }

  // "Konumumu Bul" GPS
  if (locateBtn) {
    locateBtn.addEventListener('click', () => {
      if (!navigator.geolocation) return;
      const origText = locateBtn.textContent;
      locateBtn.textContent = '...';

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locateBtn.textContent = origText;
          syncCoordinates(pos.coords.latitude, pos.coords.longitude, {
            setCustomDropdown: true,
            fly: true,
            zoom: 9
          });
        },
        () => {
          locateBtn.textContent = origText;
          alert('Konum izni alınamadı. Haritaya tıklayarak pin bırakabilirsiniz.');
        }
      );
    });
  }

  setTimeout(() => map.invalidateSize(), 200);
  window.addEventListener('resize', () => map.invalidateSize());
}