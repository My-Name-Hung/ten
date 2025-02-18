import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/navBar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaMapMarkerAlt, FaStore, FaImages, FaTimes, FaArrowLeft } from 'react-icons/fa';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useTranslateWidget } from '../../../contexts/TranslateWidgetContext';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function StoreGallery() {
  const { eventId, storeId } = useParams();
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);
  const { setIsWidgetVisible } = useTranslateWidget();

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

  // Fetch photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch(`https://ten-p521.onrender.com/store-audit-images/${storeId}/${eventId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        // Transform data to ensure location is properly structured
        const transformedPhotos = data.map(photo => ({
          ...photo,
          location: {
            latitude: parseFloat(photo.latitude),
            longitude: parseFloat(photo.longitude)
          }
        }));
        
        setPhotos(transformedPhotos);
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

  const handleBack = () => {
    navigate(`/event-detail/${eventId}`);
  };

  // Cập nhật khi mở/đóng modal ảnh
  const handleOpenModal = (photo) => {
    setSelectedPhoto(photo);
    setIsWidgetVisible(false);
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
    setIsWidgetVisible(true);
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
        >
          <FaArrowLeft />
          <span>Quay lại</span>
        </button>

        {/* Store Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaStore className="text-red-600 text-xl" />
            <h2 className="text-xl font-semibold text-gray-800">
              Thông tin cửa hàng
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-gray-600">Tên cửa hàng: <span className="font-medium text-gray-900">{storeInfo?.name}</span></p>
              <p className="text-gray-600 pt-2">Mã cửa hàng: <span className='font-medium text-gray-900'>{storeInfo?.store_id}</span></p>
              <p className="text-gray-600 pt-2">Địa chỉ: <span className='font-medium text-gray-900'>{storeInfo?.address}</span></p>
            </div>
            {getStatusBadge(storeStatus)}
          </div>
        </div>

        {/* Photos Grid - Updated for better mobile display */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <FaImages className="text-red-600 text-xl" />
            <h2 className="text-xl font-semibold text-gray-800">
              Hình ảnh cửa hàng
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer group"
                onClick={() => handleOpenModal(photo)}
              >
                {/* Location Overlay */}
                {(photo.latitude || photo.longitude) && (
                  <div className="absolute top-0 left-0 right-0 z-10">
                    <div className="bg-black/50 p-1.5 text-xs">
                      <p className="text-red-500 font-medium flex items-center">
                        <FaMapMarkerAlt className="mr-1 text-xs" />
                        {parseFloat(photo.latitude).toFixed(5)},
                        {parseFloat(photo.longitude).toFixed(5)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Image */}
                <div className="aspect-square overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Image Type Label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">
                    {photo.image_type === 'mattien' ? 'Mặt tiền' :
                     photo.image_type === 'tongquan' ? 'Tổng quan' :
                     'Bổ sung'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Image Modal - Keep existing modal code */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <div className="max-w-4xl w-full relative">
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors z-[1000] p-2"
              >
                <FaTimes size={24} />
              </button>

              {/* Location Overlay */}
              {(selectedPhoto.latitude || selectedPhoto.longitude) && (
                <div className="absolute top-0 left-0 right-0 z-10">
                  <div className="bg-black/50 p-3 inline-block rounded-br-lg">
                    <p className="text-red-500 font-medium text-sm flex items-center">
                      <FaMapMarkerAlt className="mr-2" />
                      Lat: {parseFloat(selectedPhoto.latitude).toFixed(5)}, 
                      Long: {parseFloat(selectedPhoto.longitude).toFixed(5)}
                    </p>
                  </div>
                </div>
              )}

              {/* Image */}
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.title}
                  className="w-full h-auto max-h-[85vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreGallery; 