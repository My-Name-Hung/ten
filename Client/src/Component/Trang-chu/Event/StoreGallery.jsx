import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../Navbar/navBar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaMapMarkerAlt, FaStore, FaImages } from 'react-icons/fa';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function StoreGallery() {
  const { eventId, storeId } = useParams();
  const [storeInfo, setStoreInfo] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);

  // Fetch store info
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const response = await fetch(`https://ten-p521.onrender.com/store-info/${storeId}`);
        const data = await response.json();
        setStoreInfo(data);
      } catch (error) {
        console.error('Error fetching store info:', error);
      }
    };
    fetchStoreInfo();
  }, [storeId]);

  // Fetch photos and location
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch(`https://ten-p521.onrender.com/store-audit-images/${storeId}/${eventId}`);
        const data = await response.json();
        setPhotos(data);
        
        // Get location from the first photo
        if (data.length > 0 && data[0].location) {
          setLocation(data[0].location);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [storeId, eventId]);

  // Fetch store status
  useEffect(() => {
    const fetchStoreStatus = async () => {
      try {
        const response = await fetch(`https://ten-p521.onrender.com/store-status/${storeId}/${eventId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setStoreStatus(data.status || 'Đang chờ duyệt'); // Mặc định 'Đang chờ duyệt' nếu đã có ảnh
      } catch (error) {
        console.error('Error fetching store status:', error);
        setStoreStatus(null);
      }
    };
    fetchStoreStatus();
  }, [storeId, eventId]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Đang chờ duyệt': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '⏳'
      },
      'Đạt': {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '✓'
      },
      'Không đạt': {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: '✗'
      },
      'Làm lại': {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '↻'
      }
    };

    const config = statusConfig[status] || {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: '•'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {status || 'Chưa kiểm tra'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Store Info Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaStore className="text-red-600 text-xl" />
            <h2 className="text-xl font-semibold text-gray-800">
              Thông tin cửa hàng
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Tên cửa hàng</p>
                <p className="font-medium text-gray-800">{storeInfo?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mã cửa hàng</p>
                <p className="font-medium text-gray-800">{storeInfo?.store_id}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="font-medium text-gray-800">{storeInfo?.address}</p>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Trạng thái</p>
                {getStatusBadge(storeStatus)}
              </div>
            </div>
          </div>
        </div>

        {/* Location Section */}
        {location && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FaMapMarkerAlt className="text-red-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-800">
                Vị trí cửa hàng
              </h2>
            </div>
            
            <div className="h-[400px] rounded-lg overflow-hidden">
              <MapContainer
                center={[location.latitude, location.longitude]}
                zoom={16}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-medium">{storeInfo?.name}</p>
                      <p className="text-sm text-gray-600">{storeInfo?.address}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}

        {/* Gallery Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <FaImages className="text-red-600 text-xl" />
            <h2 className="text-xl font-semibold text-gray-800">
              Hình ảnh cửa hàng
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer group"
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Location Overlay */}
                {photo.location && (
                  <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-3">
                    <p className="text-red-500 font-medium text-sm flex items-center">
                      <FaMapMarkerAlt className="mr-2" />
                      Lat: {photo.location.latitude.toFixed(5)}, Long: {photo.location.longitude.toFixed(5)}
                    </p>
                  </div>
                )}

                {/* Image */}
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-white font-medium">
                    {photo.title || (
                      photo.image_type === 'mattien' ? 'Hình mặt tiền' :
                      photo.image_type === 'tongquan' ? 'Hình tổng quan' :
                      'Hình bổ sung'
                    )}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-5xl w-full relative">
            {/* Location in Modal */}
            {selectedPhoto.location && (
              <div className="absolute top-4 left-4 z-10 bg-black/50 px-4 py-2 rounded-lg">
                <p className="text-red-500 font-medium text-sm flex items-center">
                  <FaMapMarkerAlt className="mr-2" />
                  Lat: {selectedPhoto.location.latitude.toFixed(5)}, Long: {selectedPhoto.location.longitude.toFixed(5)}
                </p>
              </div>
            )}

            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.title}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Close button */}
            <button
              className="absolute top-2 right-2 text-white hover:text-red-500 transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreGallery; 