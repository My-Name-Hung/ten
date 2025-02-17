import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/navBar';
import { FaCamera, FaMapMarkerAlt } from 'react-icons/fa';

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

  // Xử lý chụp ảnh
  const handleCapture = async (photoType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      
      video.srcObject = stream;
      await video.play();

      // Chụp ảnh
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      // Chuyển ảnh thành base64
      const photoData = canvas.toDataURL('image/jpeg');
      
      // Lưu ảnh vào state
      setPhotos(prev => ({
        ...prev,
        [photoType]: photoData
      }));

      // Dừng camera
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

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
      
      {/* Store Info Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
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

        {/* Photo Capture Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Chụp ảnh cửa hàng
          </h2>
          
          {/* Tổng quan */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Hình ảnh tổng quan
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Chụp toàn bộ mặt tiền cửa hàng, bao gồm biển hiệu và khu vực xung quanh
            </p>
            {photos.tongquan ? (
              <div className="relative">
                <img 
                  src={photos.tongquan} 
                  alt="Tổng quan" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleCapture('tongquan')}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md"
                >
                  <FaCamera className="text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleCapture('tongquan')}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-red-500 transition-colors"
              >
                <FaCamera className="text-gray-400 text-3xl mb-2" />
                <span className="text-sm text-gray-500">Chụp ảnh</span>
              </button>
            )}
          </div>

          {/* Mặt tiền */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Hình ảnh mặt tiền
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Chụp cận cảnh biển hiệu cửa hàng
            </p>
            {photos.mattien ? (
              <div className="relative">
                <img 
                  src={photos.mattien} 
                  alt="Mặt tiền" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleCapture('mattien')}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md"
                >
                  <FaCamera className="text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleCapture('mattien')}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-red-500 transition-colors"
              >
                <FaCamera className="text-gray-400 text-3xl mb-2" />
                <span className="text-sm text-gray-500">Chụp ảnh</span>
              </button>
            )}
          </div>
        </div>

        {/* Submit Button */}
        {Object.values(photos).some(photo => photo) && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
            <div className="container mx-auto px-4">
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