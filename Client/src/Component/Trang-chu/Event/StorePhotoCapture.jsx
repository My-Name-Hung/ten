import { useEffect, useRef, useState, useCallback } from "react";
import { FaCamera, FaTimes, FaMapMarkerAlt, FaBarcode } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Webcam from "react-webcam";
import Navbar from "../Navbar/navBar";
import { useTranslateWidget } from '../../../contexts/TranslateWidgetContext';
import Swal from 'sweetalert2';
import BarcodeScanner from '../../BarcodeScanner/BarcodeScanner';
import axios from 'axios';
import {
  BarcodeBatch,
  BarcodeBatchSettings,
  BarcodeBatchBasicOverlay,
  Symbology
} from "@scandit/web-datacapture-barcode";
import { LICENSE_KEY_SCANDIT } from '../../../config/config';
import successSound from '../../../assets/sounds/success-beep.mp3';

function StorePhotoCapture() {
  const { eventId, storeId } = useParams();
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState(null);
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState(null);
  const [error, setError] = useState(null);
  const [photoTypes, setPhotoTypes] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: null,
    location: null,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const webcamRef = useRef(null);
  const [currentPhotoDescription, setCurrentPhotoDescription] = useState("");
  const [cameraPermission, setCameraPermission] = useState(false);
  const { setIsWidgetVisible } = useTranslateWidget();
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProducts, setScannedProducts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const contextRef = useRef(null);
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [isMultiScanActive, setIsMultiScanActive] = useState(false);
  const successAudioRef = useRef(new Audio(successSound));

  // Khai báo getCurrentLocation trước khi sử dụng
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation không được hỗ trợ'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Không thể lấy vị trí: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }, []);

  // Thêm hàm để lấy orientation từ EXIF data
  const getExifOrientation = (base64Data) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function() {
        // Tạo canvas tạm để đọc EXIF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0);
        try {
          // Thử đọc orientation từ EXIF
          const orientation = ctx.getImageData(0, 0, 1, 1).data[0];
          resolve(orientation || 1); // Mặc định là 1 nếu không có EXIF
        } catch (e) {
          resolve(1);
        }
      };
      img.src = base64Data;
    });
  };

  // Đơn giản hóa hàm optimizeImage
  const optimizeImage = async (base64Image) => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Giữ nguyên kích thước gốc của ảnh
        canvas.width = img.width;
        canvas.height = img.height;

        // Vẽ ảnh với chất lượng cao
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Vẽ ảnh trực tiếp không xoay hay scale
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Convert sang base64 với chất lượng cao
        const optimizedImage = canvas.toDataURL('image/jpeg', 0.95);
        resolve(optimizedImage);
      };

      img.src = base64Image;
    });
  };

  // Cập nhật videoConstraints để không ép tỷ lệ cố định
  const videoConstraints = {
    facingMode: "environment",
    width: { ideal: 1920 },
    height: { ideal: 1080 }
    // Bỏ aspectRatio để camera tự điều chỉnh theo thiết bị
  };

  // Cập nhật handleTakePhoto
  const handleTakePhoto = useCallback(async () => {
    try {
      if (!webcamRef.current) return;

      // Chụp ảnh với kích thước thực tế của camera
      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) {
        throw new Error('Không thể chụp ảnh');
      }

      // Tối ưu ảnh nhưng giữ nguyên orientation
      const optimizedImage = await optimizeImage(imageSrc);
      const location = await getCurrentLocation();

      setPhotos(prev => ({
        ...prev,
        [currentPhotoType]: {
          image: optimizedImage,
          location,
          timestamp: new Date().toISOString()
        }
      }));

      setShowCamera(false);
      setIsWidgetVisible(true);
      setHasUnsavedChanges(true);

    } catch (error) {
      console.error("Error taking photo:", error);
      setError("Không thể chụp ảnh. Vui lòng thử lại.");
    }
  }, [currentPhotoType, getCurrentLocation, setIsWidgetVisible]);

  // Cập nhật CameraModal để hiển thị camera đúng
  const CameraModal = () => {
    if (!showCamera) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="relative h-full">
          {/* Hiển thị mô tả hình ảnh */}
          <div className="absolute top-0 left-0 right-0 bg-black/50 text-white p-4 z-10">
            <h3 className="text-lg font-medium mb-2">
              {photoTypes.find(t => t.type_id === currentPhotoType)?.title}
            </h3>
            <p className="text-sm opacity-90">
              {currentPhotoDescription}
            </p>
          </div>

          <div className="relative h-full">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="h-full w-full object-cover"
              style={{
                width: '100%',
                height: '100%'
              }}
              onUserMediaError={(err) => {
                console.error('Camera Error:', err);
                setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
                setShowCamera(false);
              }}
            />
          </div>
          
          {/* Camera Controls */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={handleCloseCamera}
              className="bg-white/20 text-white px-6 py-2 rounded-full"
            >
              Hủy
            </button>
            <button
              onClick={handleTakePhoto}
              className="bg-white text-black px-8 py-2 rounded-full"
            >
              Chụp
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Kiểm tra và yêu cầu quyền truy cập
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Kiểm tra quyền truy cập vị trí
        const locationPermission = await navigator.permissions.query({
          name: "geolocation",
        });
        setPermissionStatus(prev => ({
          ...prev,
          location: locationPermission.state
        }));

        // Kiểm tra quyền truy cập camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setPermissionStatus(prev => ({
          ...prev,
          camera: "granted"
        }));
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error("Error checking permissions:", error);
        setError("Vui lòng cấp quyền truy cập camera và vị trí để tiếp tục");
      }
    };

    checkPermissions();
  }, []);

  // Lấy thông tin cửa hàng
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const response = await fetch(
          `https://ten-p521.onrender.com/store-info/${storeId}`
        );
        const data = await response.json();
        setStoreInfo(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching store info:", error);
        setLoading(false);
      }
    };

    fetchStoreInfo();
  }, [storeId]);

  // Kiểm tra ảnh đã tồn tại
  useEffect(() => {
    const fetchExistingPhotos = async () => {
      try {
        const response = await fetch(
          `https://ten-p521.onrender.com/store-audit-images/${storeId}/${eventId}`
        );
        const data = await response.json();

        const photosByType = data.reduce((acc, photo) => {
          acc[photo.image_type] = photo.image_url;
          return acc;
        }, {});

        setExistingPhotos(photosByType);
        setPhotos(photosByType);
      } catch (error) {
        console.error("Error fetching existing photos:", error);
      }
    };

    fetchExistingPhotos();
  }, [storeId, eventId]);

  // Cập nhật useEffect để lấy photo types theo eventId
  useEffect(() => {
    const fetchPhotoTypes = async () => {
      try {
        const response = await fetch(
          `https://ten-p521.onrender.com/photo-types/${eventId}`
        );
        const data = await response.json();
        setPhotoTypes(data);

        // Khởi tạo state photos với các loại hình được phép
        const initialPhotos = data.reduce((acc, type) => {
          acc[type.type_id] = null;
          return acc;
        }, {});
        setPhotos(initialPhotos);
      } catch (error) {
        console.error("Error fetching photo types:", error);
      }
    };

    fetchPhotoTypes();
  }, [eventId]);

  // Theo dõi thay đổi của photos để cập nhật hasUnsavedChanges
  useEffect(() => {
    const hasPhotos = Object.values(photos).some((photo) => photo !== null);
    setHasUnsavedChanges(hasPhotos);
  }, [photos]);

  // Xử lý khi người dùng cố gắng rời khỏi trang
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        const message = "Thông tin chưa được lưu. Bạn có chắc chắn muốn thoát?";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const handleRouteChange = (e) => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(
          "Thông tin chưa được lưu. Bạn có chắc chắn muốn thoát?"
        );
        if (!confirmLeave) {
          if (e.preventDefault) {
            e.preventDefault();
          }
          if (e.stopPropagation) {
            e.stopPropagation();
          }
          history.pushState(null, "", window.location.href);
          return false;
        }
      }
    };

    const handleNavigate = (e) => {
      if (
        hasUnsavedChanges &&
        e.target.tagName === "A" &&
        !e.target.hasAttribute("download")
      ) {
        const confirmLeave = window.confirm(
          "Thông tin chưa được lưu. Bạn có chắc chắn muốn thoát?"
        );
        if (!confirmLeave) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // Thêm event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handleRouteChange);
    document.addEventListener("click", handleNavigate, true);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handleRouteChange);
      document.removeEventListener("click", handleNavigate, true);
    };
  }, [hasUnsavedChanges]);

  // Kiểm tra và yêu cầu quyền camera
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Camera permission error:", err);
      setError("Vui lòng cấp quyền truy cập camera");
      setCameraPermission(false);
    }
  }, []);

  // Xử lý khi người dùng click nút chụp ảnh
  const handleCapture = useCallback(async (photoType, description) => {
    try {
      if (!cameraPermission) {
        await requestCameraPermission();
      }
      setCurrentPhotoType(photoType);
      setCurrentPhotoDescription(description);
      setShowCamera(true);
      setIsWidgetVisible(false);
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error("Error in handleCapture:", error);
    }
  }, [cameraPermission, requestCameraPermission, setIsWidgetVisible]);

  // Cập nhật hàm xử lý barcode detection
  const handleBarcodeDetection = async (barcodes) => {
    try {
      if (barcodes && barcodes.length > 0) {
        // Phát âm thanh thành công cho mỗi mã vạch mới
        try {
          successAudioRef.current.currentTime = 0;
          await successAudioRef.current.play();
        } catch (error) {
          console.error('Error playing sound:', error);
        }

        // Thêm các mã vạch mới vào danh sách
        setScannedBarcodes(prev => {
          const newBarcodes = barcodes.filter(barcode => !prev.includes(barcode));
          
          if (newBarcodes.length > 0) {
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 1500,
              timerProgressBar: true
            });

            Toast.fire({
              icon: 'success',
              title: `Đã quét ${newBarcodes.length} mã vạch mới`
            });

            return [...prev, ...newBarcodes];
          }
          return prev;
        });

        // Không tự động đóng scanner để cho phép quét tiếp
      }
    } catch (error) {
      console.error('Error handling barcode:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Có lỗi xảy ra khi xử lý mã vạch'
      });
    }
  };

  // Cập nhật phần render scanner
  const renderBarcodeScanner = () => {
    if (!showScanner) return null;

    return (
      <BarcodeScanner
        onDetected={handleBarcodeDetection}
        onClose={() => setShowScanner(false)}
        settings={{
          enableMultiScan: true,
          maxMultiScanCount: 50,
          multiScanTimeout: 200
        }}
      />
    );
  };

  // Cập nhật component hiển thị danh sách mã đã quét
  const ScannedBarcodesList = () => {
    if (scannedBarcodes.length === 0) return null;

    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-800">
              Mã vạch đã quét ({scannedBarcodes.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  Swal.fire({
                    title: 'Xác nhận xóa',
                    text: 'Bạn có chắc chắn muốn xóa tất cả mã vạch đã quét?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Xóa',
                    cancelButtonText: 'Hủy'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      setScannedBarcodes([]);
                      Swal.fire({
                        icon: 'success',
                        title: 'Đã xóa thành công',
                        showConfirmButton: false,
                        timer: 1500
                      });
                    }
                  });
                }}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Xóa tất cả
              </button>
              <button
                onClick={() => navigate('/scanned-items')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem chi tiết sản phẩm
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {scannedBarcodes.map((barcode, index) => (
              <div 
                key={`${barcode}-${index}`} 
                className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">Mã vạch: {barcode}</p>
                </div>
                <button
                  onClick={() => {
                    setScannedBarcodes(prev => 
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Hiển thị lỗi
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Lỗi!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Component hiển thị thông báo quyền truy cập
  const PermissionAlert = () => {
    if (permissionStatus.camera === 'denied' || permissionStatus.location === 'denied') {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaTimes className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Vui lòng cấp quyền truy cập {permissionStatus.camera === 'denied' ? 'camera' : ''} 
                {permissionStatus.camera === 'denied' && permissionStatus.location === 'denied' ? ' và ' : ''}
                {permissionStatus.location === 'denied' ? 'vị trí' : ''} để tiếp tục.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Cập nhật khi đóng camera
  const handleCloseCamera = () => {
    setShowCamera(false);
    setIsWidgetVisible(true);
  };

  // Cập nhật hiển thị ảnh đã chụp
  const PhotoDisplay = ({ type, imageUrl }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="relative" style={{ aspectRatio: "4/3" }}>
        <img
          src={imageUrl}
          alt={photoTypes.find((t) => t.type_id === type)?.title}
          className="w-full h-full object-contain"
          onClick={() => handleImageClick(imageUrl)}
          style={{ 
            backgroundColor: '#f8f9fa',
            maxHeight: '500px'
          }}
        />
      </div>
    </div>
  );

  // Tối ưu hàm submit
  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      
      // Upload tất cả ảnh song song
      await Promise.all(
        Object.entries(photos).map(([type, data]) => {
          if (!data) return Promise.resolve();
          
          return fetch(`https://ten-p521.onrender.com/store-audit-images/${storeId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: data.image,
              image_type: type,
              location: data.location,
              event_id: eventId,
            }),
          });
        })
      );

      // Cập nhật trạng thái
      await fetch(`https://ten-p521.onrender.com/store-event-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          eventid: eventId,
          status_type: "Đang chờ duyệt",
        }),
      });

      setHasUnsavedChanges(false);
      alert("Cập nhật thông tin thành công!");
      navigate(`/event-detail/${eventId}`);
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin!");
    } finally {
      setLoading(false);
    }
  }, [photos, storeId, eventId, navigate]);

  // Thêm hàm xử lý khi người dùng muốn thoát có chủ đích
  const handleExit = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "Thông tin chưa được lưu. Bạn có chắc chắn muốn thoát?"
      );

      if (confirmLeave) {
        navigate(`/event-detail/${eventId}`);
      }
    } else {
      navigate(`/event-detail/${eventId}`);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const ImageModal = ({ imageUrl, onClose }) => {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div className="relative max-w-4xl w-full">
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white hover:text-gray-300"
          >
            <FaTimes size={24} />
          </button>
          <img
            src={imageUrl}
            alt="Product"
            className="w-full h-auto rounded-lg"
          />
        </div>
      </div>
    );
  };

  // Thêm useEffect để xử lý âm thanh
  useEffect(() => {
    successAudioRef.current.volume = 0.5;
    
    return () => {
      successAudioRef.current.pause();
      successAudioRef.current.currentTime = 0;
    };
  }, []);

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
        {/* Thêm nút thoát */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={handleExit}
            className="text-gray-600 hover:text-red-600 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Quay lại
          </button>
        </div>

        {/* Thêm thông báo quyền truy cập */}
        <PermissionAlert />

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
              <p className="font-medium">{storeInfo?.channel || "Mặc định"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Suất</p>
              <p className="font-medium">Mặc định</p>
            </div>
          </div>
        </div>

        {/* Photo Capture Section */}
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
                  </div>

                  {/* Photo Display/Capture */}
                  <div className="md:w-full">
                    {photos[type.type_id] ? (
                      <PhotoDisplay
                        type={type.type_id}
                        imageUrl={photos[type.type_id].image}
                      />
                    ) : (
                      <button
                        onClick={() => handleCapture(type.type_id, type.description)}
                        className="w-full aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-red-500 transition-colors bg-white group"
                      >
                        <div className="transform group-hover:scale-110 transition-transform">
                          <FaCamera className="text-gray-400 text-3xl mb-2" />
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
        <CameraModal />

        {/* Thêm nút quét mã vạch */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-up">
          <div className="container mx-auto flex justify-between items-center">
            
            {/* Submit Button */}
            {Object.values(photos).some((photo) => photo) && (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-red-600 text-white rounded-full"
              >
                Hoàn thành
              </button>
            )}
          </div>
        </div>

        {/* Hiển thị vị trí hiện tại nếu có */}
        {location && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-600">
              <FaMapMarkerAlt className="mr-2 text-red-500" />
              <span>
                Vị trí: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => {
            setShowImageModal(false);
            setSelectedImage(null);
          }}
        />
      )}

      {/* Scanner Button */}
      <div className="fixed bottom-20 right-6">
        <button
          onClick={() => setShowScanner(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <FaBarcode size={24} />
        </button>
      </div>

      {/* Scanner */}
      {showScanner && renderBarcodeScanner()}

      {/* Scanned Barcodes List */}
      <ScannedBarcodesList />
    </div>
  );
}

export default StorePhotoCapture;
