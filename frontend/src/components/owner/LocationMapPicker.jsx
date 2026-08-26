import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Navigation } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

// Import Leaflet CSS dynamically to avoid SSR issues
import 'leaflet/dist/leaflet.css';

/**
 * Interactive Location Map Picker using Leaflet + OpenStreetMap
 * - Click anywhere on the map to place/move the pin
 * - Drag the pin to adjust location
 * - Lat/Lng update live on every interaction
 * - "Use My Location" uses browser Geolocation API
 */
const BHILWARA_LOCALITIES = [
  { name: 'R.C. Vyas Colony', lat: 25.3524, lng: 74.6462 },
  { name: 'Shastri Nagar', lat: 25.3418, lng: 74.6325 },
  { name: 'Subhash Nagar', lat: 25.3350, lng: 74.6410 },
  { name: 'Azad Nagar', lat: 25.3610, lng: 74.6520 },
  { name: 'Karni Nagar', lat: 25.3580, lng: 74.6290 },
  { name: 'Vijay Singh Pathik Nagar', lat: 25.3660, lng: 74.6380 },
  { name: 'Bhilwara City Center', lat: 25.3475, lng: 74.6391 },
];

export default function LocationMapPicker({ lat, lng, onLocationChange }) {
  const { t } = usePreferences();
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const DEFAULT_LAT = 25.3475;
  const DEFAULT_LNG = 74.6391;

  const currentLat = lat || DEFAULT_LAT;
  const currentLng = lng || DEFAULT_LNG;

  const handleLocalitySelect = (locality) => {
    onLocationChange(locality.lat, locality.lng);
    if (leafletMapRef.current && markerRef.current) {
      markerRef.current.setLatLng([locality.lat, locality.lng]);
      leafletMapRef.current.setView([locality.lat, locality.lng], 16);
    }
  };

  // ── Initialize Leaflet map on mount ──
  useEffect(() => {
    if (leafletMapRef.current) return; // Already initialized

    // Dynamic import to avoid SSR/build issues
    import('leaflet').then((L) => {
      // Fix default marker icon paths broken by bundlers
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Create map
      const map = L.default.map(mapRef.current, {
        center: [currentLat, currentLng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add OpenStreetMap tile layer (completely free)
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create custom red pin icon
      const customIcon = L.default.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;cursor:grab">
            <div style="width:32px;height:32px;background:#dc2626;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
              <div style="width:10px;height:10px;background:white;border-radius:50%;transform:rotate(45deg)"></div>
            </div>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42],
      });

      // Add draggable marker
      const marker = L.default.marker([currentLat, currentLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      marker.bindPopup('<b>📍 Property Location</b><br>Drag to reposition').openPopup();

      // Update coords when marker dragged
      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onLocationChange(
          parseFloat(pos.lat.toFixed(6)),
          parseFloat(pos.lng.toFixed(6))
        );
      });

      // Click anywhere on map to move pin
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        onLocationChange(
          parseFloat(clickLat.toFixed(6)),
          parseFloat(clickLng.toFixed(6))
        );
      });

      leafletMapRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // ── Sync external lat/lng changes (from text inputs) → map ──
  useEffect(() => {
    if (!leafletMapRef.current || !markerRef.current) return;
    const newLat = parseFloat(lat) || DEFAULT_LAT;
    const newLng = parseFloat(lng) || DEFAULT_LNG;
    markerRef.current.setLatLng([newLat, newLng]);
    leafletMapRef.current.panTo([newLat, newLng]);
  }, [lat, lng]);

  // ── Use Browser Geolocation ──
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = parseFloat(pos.coords.latitude.toFixed(6));
        const newLng = parseFloat(pos.coords.longitude.toFixed(6));
        onLocationChange(newLat, newLng);
        if (leafletMapRef.current && markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          leafletMapRef.current.setView([newLat, newLng], 16);
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoError('Could not detect location. Please allow browser location access and try again.');
        setGeoLoading(false);
      },
      { timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-gold-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-navy-900">{t('map.interactive_picker', 'Interactive Location Picker')}</p>
            <p className="text-[11px] text-gray-500">{t('map.picker_subtitle', 'Click anywhere on the map or drag the pin to set the property location')}</p>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-indigo-600 hover:underline shrink-0 flex items-center gap-1"
        >
          {t('map.open_gmaps', 'Open in Google Maps ↗')}
        </a>
      </div>

      {/* Quick Locality Selector */}
      <div className="bg-amber-50/50 px-4 py-2.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-[11px] font-bold text-navy-900 shrink-0">
          📍 {t('map.quick_jump', 'Quick Bhilwara Locality Jump:')}
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {BHILWARA_LOCALITIES.map((loc) => (
            <button
              key={loc.name}
              type="button"
              onClick={() => handleLocalitySelect(loc)}
              className="px-2.5 py-1 bg-white hover:bg-navy-900 hover:text-white text-navy-900 text-[11px] font-semibold rounded-lg border border-gray-200 shadow-2xs transition-all shrink-0"
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height: '320px', width: '100%', zIndex: 0 }}
        className="bg-gray-100"
      />

      {/* Controls below map */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Crosshair size={12} />
          {t('map.gps_coords', 'GPS Coordinates — updates live when you move the pin')}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">{t('detail.locality', 'Latitude')}</label>
            <input
              type="number"
              step="any"
              value={currentLat}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onLocationChange(v, currentLng);
              }}
              className="input-field text-sm font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={currentLng}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onLocationChange(currentLat, v);
              }}
              className="input-field text-sm font-mono text-xs"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {geoLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Detecting your location…
            </>
          ) : (
            <>
              <Navigation size={14} />
              {t('map.use_my_location', 'Use My Current Device Location')}
            </>
          )}
        </button>

        {geoError && (
          <p className="text-[11px] text-red-600 font-semibold text-center">{geoError}</p>
        )}

        <p className="text-[11px] text-gray-400 text-center">
          Or find coordinates at{' '}
          <a
            href="https://www.latlong.net/convert-address-to-lat-long.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline font-semibold"
          >
            latlong.net
          </a>{' '}
          and paste them above
        </p>
      </div>
    </div>
  );
}
