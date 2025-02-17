import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/navBar';
import { FaCamera, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';

function StorePhotoCapture() {
  const { eventId, storeId } = useParams();
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState(null);
  const [location, setLocation] = useState(null);
  const [hasPermissions, setHasPermissions] = useState({
    camera: false,
    location: false
  });
  const [photos, setPhotos] = useState({
    tongquan: null,
    mattien: null,
    // Thêm các loại ảnh khác nếu cần
  });
  const [loading, setLoading] = useState(true);
  const [existingPhotos, setExistingPhotos] = useState({
    tongquan: null,
    mattien: null
  });
  const [showCamera, setShowCamera] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [photoTypes, setPhotoTypes] = useState([]);

  // Kiểm tra và yêu cầu quyền truy cập
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Yêu cầu quyền truy cập vị trí
        const locationPermission = await navigator.permissions.query({ name: 'geolocation' });
        setHasPermissions(prev => ({
          ...prev,
          location: locationPermission.state === 'granted'
        }));

        // Yêu cầu quyền truy cập camera
        const cameraPermission = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermissions(prev => ({
          ...prev,
          camera: true
        }));
        cameraPermission.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };

    requestPermissions();
  }, []);

  // Lấy thông tin cửa hàng
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const response = await fetch(`https://ten-p521.onrender.com/store-info/${storeId}`);
        const data = await response.json();
        setStoreInfo(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching store info:', error);
        setLoading(false);
      }
    };

    fetchStoreInfo();
  }, [storeId]);

  // Kiểm tra ảnh đã tồn tại
  useEffect(() => {
    const fetchExistingPhotos = async () => {
      try {
        const response = await fetch(`https://ten-p521.onrender.com/store-audit-images/${storeId}/${eventId}`);
        const data = await response.json();
        
        const photosByType = data.reduce((acc, photo) => {
          acc[photo.image_type] = photo.image_url;
          return acc;
        }, {});
        
        setExistingPhotos(photosByType);
        setPhotos(photosByType);
      } catch (error) {
        console.error('Error fetching existing photos:', error);
      }
    };

    fetchExistingPhotos();
  }, [storeId, eventId]);

  // Cập nhật useEffect để lấy photo types theo eventId
  useEffect(() => {
    const fetchPhotoTypes = async () => {
      try {
        const response = await fetch(`https://ten-p521.onrender.com/photo-types/${eventId}`);
        const data = await response.json();
        setPhotoTypes(data);
        
        // Khởi tạo state photos với các loại hình được phép
        const initialPhotos = data.reduce((acc, type) => {
          acc[type.type_id] = null;
          return acc;
        }, {});
        setPhotos(initialPhotos);
      } catch (error) {
        console.error('Error fetching photo types:', error);
      }
    };

    fetchPhotoTypes();
  }, [eventId]);

  // Lấy vị trí hiện tại
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  // Khởi động camera
  const startCamera = async (photoType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Sử dụng camera sau trên mobile
        audio: false 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCurrentPhotoType(photoType);
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Không thể truy cập camera!');
    }
  };

  // Dừng camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
    setCurrentPhotoType(null);
  };

  // Xử lý chụp ảnh
  const handleCapture = async (photoType) => {
    if (photos[photoType]) {
      alert('Ảnh đã được chụp và không thể thay đổi!');
      return;
    }
    
    startCamera(photoType);
  };

  // Xử lý khi chụp ảnh từ camera
  const capturePhoto = () => {
    getCurrentLocation(); // Lấy vị trí khi chụp ảnh
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/jpeg');
    setPhotos(prev => ({
      ...prev,
      [currentPhotoType]: photoData
    }));
    
    stopCamera();
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Xử lý hoàn thành
  const handleSubmit = async () => {
    try {
      // Upload ảnh và cập nhật trạng thái
      const photoUploadPromises = Object.entries(photos).map(([type, data]) => {
        if (data) {
          return fetch(`https://ten-p521.onrender.com/store-audit-images/${storeId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image_url: data,
              image_type: type,
              location: location,
              event_id: eventId
            }),
          });
        }
        return Promise.resolve();
      });

      await Promise.all(photoUploadPromises);

      // Cập nhật trạng thái cửa hàng
      await fetch(`https://ten-p521.onrender.com/store-event-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id: storeId,
          eventid: eventId,
          status_type: 'Đang chờ duyệt'
        }),
      });

      // Hiển thị thông báo thành công
      alert('Cập nhật thông tin thành công!');

      // Chuyển hướng về trang chi tiết sự kiện
      navigate(`/event-detail/${eventId}`);
    } catch (error) {
      console.error('Error submitting data:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin!');
    }
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
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Store Info Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            Thông tin cửa hàng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tên cửa hàng</p>
              <p className="font-medium">{storeInfo?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mã cửa hàng</p>
              <p className="font-medium">{storeInfo?.store_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Địa chỉ</p>
              <p className="font-medium">{storeInfo?.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Số điện thoại</p>
              <p className="font-medium">{storeInfo?.mobilephone}</p>
            </div>
          </div>
        </div>

        {/* Channel & Suất Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            Thông tin kênh và suất
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Kênh</p>
              <p className="font-medium">{storeInfo?.channel || 'Mặc định'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Suất</p>
              <p className="font-medium">Mặc định</p>
            </div>
          </div>
        </div>

        {/* Photo Capture Section - Updated UI */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-20">
          <h2 className="text-xl font-semibold text-red-800 mb-6">
            Chụp ảnh cửa hàng
          </h2>
          
          <div className="space-y-8">
            {photoTypes.map((type) => (
              <div key={type.type_id} className="bg-gray-50 rounded-lg p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Photo Info */}
                  <div className="md:w-1/3 space-y-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {type.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {type.description}
                    </p>
                  </div>
                  
                  {/* Photo Display/Capture */}
                  <div className="md:w-2/3">
                    {photos[type.type_id] ? (
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                        <img 
                          src={photos[type.type_id]} 
                          alt={type.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-white text-center p-4">
                            <p className="font-medium mb-2">Ảnh đã chụp</p>
                            <p className="text-sm">Không thể thay đổi</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCapture(type.type_id)}
                        className="w-full aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-red-500 transition-colors bg-white group"
                      >
                        <div className="transform group-hover:scale-110 transition-transform">
                          <FaCamera className="text-gray-400 text-3xl mb-2" />
                          <span className="text-sm text-gray-500">Chụp ảnh</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black z-50">
            <div className="h-full relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Camera UI */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Grid Lines */}
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>

              {/* Top Bar */}
              <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="text-white text-center text-sm font-medium">
                  {photoTypes.find(t => t.type_id === currentPhotoType)?.title}
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex justify-between items-center max-w-md mx-auto">
                  <button
                    onClick={stopCamera}
                    className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={capturePhoto}
                    className="p-4 rounded-full bg-white text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <FaCamera className="w-8 h-8" />
                  </button>
                  
                  <div className="w-12" /> {/* Spacer */}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {Object.values(photos).some(photo => photo) && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
            <div className="container mx-auto px-4 max-w-4xl">
              <button
                onClick={handleSubmit}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Hoàn thành
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StorePhotoCapture; 