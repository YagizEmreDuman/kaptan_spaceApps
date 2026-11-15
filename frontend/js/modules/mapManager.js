let globalMapInstance = null;

export function refreshMapSize() {
  if (globalMapInstance) {
    setTimeout(() => globalMapInstance.invalidateSize(), 100);
  }
}

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

  // Free Tile Layers Without API Key
  const osmStreetTiles = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap',
      noWrap: true,
      maxZoom: 18
    }
  );

  const esriSatelliteTiles = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: '&copy; Esri',
      noWrap: true,
      maxZoom: 18
    }
  );

  osmStreetTiles.addTo(map);

  // Add Map / Satellite layer switcher to top right
  L.control.layers(
    {
      '🗺️ Map': osmStreetTiles,
      '🛰️ Satellite': esriSatelliteTiles
    },
    null,
    { position: 'topright' }
  ).addTo(map);

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
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';

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

  map.on('click', (e) => {
    syncCoordinates(e.latlng.lat, e.latlng.lng, { setCustomDropdown: true, fly: false });
  });

  marker.on('dragend', () => {
    const pos = marker.getLatLng();
    syncCoordinates(pos.lat, pos.lng, { setCustomDropdown: true, fly: false });
  });

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
        alert('Location not found. Try a different city or country name.');
      }
    } catch {
      alert('Could not connect to the search service; you can select directly by clicking on the map.');
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
          alert('Location permission denied. You can drop a pin by clicking on the map.');
        }
      );
    });
  }

  setTimeout(() => map.invalidateSize(), 200);
  window.addEventListener('resize', () => map.invalidateSize());
}