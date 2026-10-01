import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Crosshair, AlertCircle, Compass } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Custom marker icon to prevent missing leaflet asset issues
const farmPinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle clicks on the map to place/move the farm marker
function LocationMarker({ position, setPosition, onCoordsChange }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onCoordsChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(newPos, map.getZoom());
    }
  });

  return position ? (
    <Marker
      position={position}
      icon={farmPinIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          const newPos = [pos.lat, pos.lng];
          setPosition(newPos);
          onCoordsChange(pos.lat, pos.lng);
        }
      }}
    />
  ) : null;
}

// Controller to fly map to coordinates when location changes
function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.flyTo(coords, 15, { animate: true, duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

export const RapidoMapPicker = ({
  locationData,
  onChange,
  error
}) => {
  const { t, language } = useLanguage();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Default coordinate: Kovvur/Rajahmundry Godavari farmland AP (17.0044, 81.7300)
  const [position, setPosition] = useState([
    locationData.latitude || 17.0044,
    locationData.longitude || 81.7300
  ]);

  // Request GPS Location (Rapido-style)
  const handleDetectGPS = () => {
    setGpsLoading(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError(
        language === 'te'
          ? 'మీ బ్రౌజర్‌లో GPS సదుపాయం అందుబాటులో లేదు'
          : language === 'hi'
          ? 'आपके ब्राउज़र में GPS उपलब्ध नहीं है'
          : 'Geolocation is not supported by your browser'
      );
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);

        // Attempt reverse geocoding via OpenStreetMap Nominatim for village/address
        let detectedAddress = `Farm Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        let detectedVillage = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.address) {
            detectedAddress = data.display_name || detectedAddress;
            detectedVillage = data.address.village || data.address.town || data.address.suburb || data.address.county || '';
          }
        } catch (e) {
          // ignore geocode network errors
        }

        onChange({
          ...locationData,
          latitude: lat,
          longitude: lng,
          address: locationData.address || detectedAddress,
          village: locationData.village || detectedVillage
        });

        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS detection failed:', err.message);
        setGpsError(
          language === 'te'
            ? 'GPS లొకేషన్ అనుమతి లభించలేదు. దయచేసి మ్యాప్‌పై నేరుగా క్లిక్ చేయండి.'
            : language === 'hi'
            ? 'GPS अनुमति अस्वीकृत हुई। कृपया सीधे मानचित्र पर क्लिक करें।'
            : 'GPS permission denied or unavailable. Please click directly on the map.'
        );
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleCoordsChange = async (lat, lng) => {
    // Reverse geocode on click if address is empty
    let newAddress = locationData.address;
    let newVillage = locationData.village;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.address) {
        if (!newAddress || newAddress.startsWith('Farm Location')) {
          newAddress = data.display_name;
        }
        if (!newVillage) {
          newVillage = data.address.village || data.address.town || data.address.county || '';
        }
      }
    } catch (e) {
      // fallback
    }

    onChange({
      ...locationData,
      latitude: lat,
      longitude: lng,
      address: newAddress,
      village: newVillage
    });
  };

  return (
    <div className="space-y-4 bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            {t('booking.locationSection')}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t('booking.mapInstruction')}
          </p>
        </div>

        {/* Rapido style GPS Button */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={gpsLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-60"
        >
          <Crosshair className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
          <span>{gpsLoading ? 'Detecting GPS...' : t('booking.useGps')}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs flex items-center gap-2 border border-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Interactive Map */}
      <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner z-0">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onCoordsChange={handleCoordsChange}
          />
          <MapRecenter coords={position} />
        </MapContainer>

        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow text-[11px] font-mono text-gray-700 border border-gray-200">
          📍 Lat: {locationData.latitude ? locationData.latitude.toFixed(5) : '0.00000'}, Lng: {locationData.longitude ? locationData.longitude.toFixed(5) : '0.00000'}
        </div>
      </div>

      {/* Address and Mandatory Landmark / Instructions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Village / Place */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {language === 'te' ? 'గ్రామం / ప్రాంతం' : language === 'hi' ? 'गांव / क्षेत्र' : 'Village / Area'}
          </label>
          <input
            type="text"
            value={locationData.village || ''}
            onChange={(e) => onChange({ ...locationData, village: e.target.value })}
            placeholder="e.g. Peddapuram / Kovvur"
            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {t('booking.address')} *
          </label>
          <input
            type="text"
            value={locationData.address || ''}
            onChange={(e) => onChange({ ...locationData, address: e.target.value })}
            placeholder={t('booking.addressPlaceholder')}
            required
            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Landmark (Compulsory if no detailed instructions) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {t('booking.landmark')} <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={locationData.landmark || ''}
            onChange={(e) => onChange({ ...locationData, landmark: e.target.value })}
            placeholder={t('booking.landmarkPlaceholder')}
            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <p className="text-[10px] text-amber-700 mt-1">
            {t('booking.landmarkRequiredNote')}
          </p>
        </div>

        {/* Detailed Location Instructions */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {t('booking.locationInstructions')}
          </label>
          <input
            type="text"
            value={locationData.locationInstructions || ''}
            onChange={(e) => onChange({ ...locationData, locationInstructions: e.target.value })}
            placeholder={t('booking.locationInstructionsPlaceholder')}
            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Mandatory Validation Warning */}
      {(!locationData.landmark?.trim() && !locationData.locationInstructions?.trim()) && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {language === 'te'
              ? 'ల్యాండ్‌మార్క్ లేదా వివరణాత్మక దారి సూచనలు తప్పనిసరి!'
              : language === 'hi'
              ? 'लैंडमार्क या विस्तृत रास्ता निर्देश अनिवार्य है!'
              : 'Either a landmark or detailed location instructions must be filled!'}
          </span>
        </div>
      )}
    </div>
  );
};

export default RapidoMapPicker;
