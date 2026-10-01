import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Crosshair, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

// Custom Farm Pin Icon
const farmIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3710/3710297.png',
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42]
});

// Component to handle clicks on the map to set location
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Component to center map when coordinates change
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 15, { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

const LocationPicker = ({ locationData, onChange, errors = {} }) => {
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [mapActive, setMapActive] = useState(true);

  // Default coordinate: Tamil Nadu central agricultural belt (Salem/Valapadi)
  const defaultLat = 11.6643;
  const defaultLng = 78.1460;

  const currentLat = locationData.latitude || defaultLat;
  const currentLng = locationData.longitude || defaultLng;

  // Reverse geocoding helper using Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        const village = addr.village || addr.suburb || addr.town || addr.county || addr.city || '';
        const road = addr.road || addr.neighbourhood || '';
        const stateDistrict = addr.state_district || addr.state || '';

        const fullAddr = [road, village, stateDistrict, addr.postcode]
          .filter(Boolean)
          .join(', ') || data.display_name;

        onChange({
          ...locationData,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          address: fullAddr || locationData.address,
          village: village || locationData.village
        });
      }
    } catch (err) {
      console.warn('Reverse geocoding fetch error:', err);
    }
  };

  // Browser GPS Location detection
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setDetecting(false);
        onChange({
          ...locationData,
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6))
        });
        await reverseGeocode(latitude, longitude);
      },
      (error) => {
        setDetecting(false);
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access or select on map.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMapPinSelected = async (lat, lng) => {
    onChange({
      ...locationData,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6))
    });
    await reverseGeocode(lat, lng);
  };

  return (
    <div className="space-y-4">
      {/* Location Detection Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-samba-50 p-4 rounded-xl border border-samba-200">
        <div>
          <h3 className="text-sm font-bold text-samba-900 flex items-center space-x-1.5">
            <Navigation className="w-4 h-4 text-samba-700" />
            <span>Farm GPS Location (Rapido-Style Detection)</span>
          </h3>
          <p className="text-xs text-samba-700 mt-0.5">
            Allow location to auto-detect your farm, or tap anywhere on the map to drop the pin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={detecting}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-samba-600 hover:bg-samba-700 text-white rounded-lg font-bold text-xs shadow-md transition disabled:opacity-50"
        >
          <Crosshair className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
          <span>{detecting ? 'Detecting GPS...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {geoError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Interactive Leaflet Map with Google Maps Fallback / External View */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md h-72 sm:h-80">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[currentLat, currentLng]} icon={farmIcon} />
          <MapClickHandler onLocationSelect={handleMapPinSelected} />
          <ChangeView center={[currentLat, currentLng]} />
        </MapContainer>

        {/* Map Overlay Badge */}
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow border border-slate-200 text-[11px] font-semibold text-slate-800 flex items-center space-x-1.5">
          <MapPin className="w-3.5 h-3.5 text-samba-600" />
          <span>Tap anywhere on the map to adjust farm pin</span>
        </div>

        {/* Google Maps link button */}
        <a
          href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow border border-slate-200 text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition"
        >
          <span>View in Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Lat/Long indicator */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 font-medium block">Farm Latitude:</span>
          <span className="font-mono font-bold text-slate-800">{currentLat}</span>
        </div>
        <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 font-medium block">Farm Longitude:</span>
          <span className="font-mono font-bold text-slate-800">{currentLng}</span>
        </div>
      </div>

      {/* Address & Village Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Farm Address / Road / Survey No. <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={locationData.address || ''}
            onChange={(e) => onChange({ ...locationData, address: e.target.value })}
            placeholder="e.g. Survey No. 44/2B, South Canal Farm Road"
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-samba-500 focus:border-transparent outline-none bg-white font-medium"
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Village / Place / Taluk
          </label>
          <input
            type="text"
            value={locationData.village || ''}
            onChange={(e) => onChange({ ...locationData, village: e.target.value })}
            placeholder="e.g. Valapadi, Salem"
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-samba-500 focus:border-transparent outline-none bg-white font-medium"
          />
        </div>
      </div>

      {/* STRICTLY COMPULSORY LANDMARK OR LOCATION INSTRUCTIONS */}
      <div className="bg-amber-50/70 p-4 rounded-xl border-2 border-amber-300 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center space-x-1.5">
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-black">
              COMPULSORY
            </span>
            <span>Landmark or Detailed Location Instructions <span className="text-red-600">*</span></span>
          </label>
        </div>

        <p className="text-[11px] text-amber-800 leading-normal">
          <strong>Crucial for Tractor Rider:</strong> The landmark is strictly required. If your farm has no official landmark, you <strong>must provide clear driving directions</strong> so the rider reaches your exact field without delays.
        </p>

        <textarea
          rows={3}
          required
          value={locationData.landmark || ''}
          onChange={(e) => onChange({ ...locationData, landmark: e.target.value })}
          placeholder="e.g. Opposite Mariamman Temple Arch. Take the mud road by the side of the irrigation channel for 400m until you see the green water tank."
          className={`w-full text-xs sm:text-sm p-3 rounded-lg border ${
            errors.landmark ? 'border-red-500 ring-2 ring-red-200' : 'border-amber-300'
          } focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white`}
        />
        {errors.landmark && (
          <p className="text-red-600 font-bold text-xs mt-1 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{errors.landmark}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
