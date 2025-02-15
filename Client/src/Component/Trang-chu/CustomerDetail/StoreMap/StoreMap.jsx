import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { renderToStaticMarkup } from 'react-dom/server';

const StoreMap = ({ storeData }) => {
  const mapRef = useRef(null);

  // Tạo custom marker icon
  const customIcon = L.divIcon({
    html: renderToStaticMarkup(
      <div className="relative">
        <FaMapMarkerAlt className="text-blue-800 text-4xl" />
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
        </div>
      </div>
    ),
    className: 'custom-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  useEffect(() => {
    if (mapRef.current && storeData?.latitude && storeData?.longitude) {
      // Fit map to marker
      const map = mapRef.current;
      map.setView([storeData.latitude, storeData.longitude], 16);
    }
  }, [storeData]);

  if (!storeData?.latitude || !storeData?.longitude) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-gray-600">Chưa có thông tin vị trí cửa hàng</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <MapContainer
        ref={mapRef}
        center={[storeData.latitude, storeData.longitude]}
        zoom={16}
        className="w-full h-[300px] sm:h-[400px] rounded-lg shadow-md"
        style={{ zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={[storeData.latitude, storeData.longitude]}
          icon={customIcon}
        >
        </Marker>
      </MapContainer>
    </div>
  );
};

export default StoreMap; 