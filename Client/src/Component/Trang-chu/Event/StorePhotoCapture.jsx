import { useEffect, useRef, useState } from "react";
import { FaCamera, FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Webcam from "react-webcam";
import Navbar from "../Navbar/navBar";

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
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [photoTypes, setPhotoTypes] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: null,
    location: null,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const webcamRef = useRef(null);
  const [currentPhotoDescription, setCurrentPhotoDescription] = useState("");

  // Cấu hình camera
  const videoConstraints = {
    facingMode: { ideal: "environment" }, // Ưu tiên camera sau
    width: { ideal: 1920 },
    height: { ideal: 1080 },
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

  // Lấy vị trí hiện tại
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Trình duyệt không hỗ trợ định vị"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          console.error("Geolocation error:", error);
          reject(new Error("Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí"));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Xử lý chụp ảnh
  const handleCapture = async (photoType) => {
    try {
      // Kiểm tra quyền truy cập
      if (permissionStatus.camera !== "granted") {
        throw new Error("Vui lòng cấp quyền truy cập camera");
      }
      if (permissionStatus.location !== "granted") {
        throw new Error("Vui lòng cấp quyền truy cập vị trí");
      }

      // Lấy vị trí trước khi chụp
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      
      // Tìm description của loại ảnh từ photoTypes
      const photoTypeInfo = photoTypes.find(type => type.type_id === photoType);
      setCurrentPhotoDescription(photoTypeInfo?.description || "");
      
      setCurrentPhotoType(photoType);
      setShowCamera(true);
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error("Error in handleCapture:", error);
    }
  };

  // Xử lý khi chụp ảnh xong
  const handleTakePhoto = async () => {
    try {
      if (!webcamRef.current) {
        throw new Error("Camera không khả dụng");
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Không thể chụp ảnh");
      }

      // Lấy vị trí hiện tại
      const currentLocation = await getCurrentLocation();

      // Cập nhật state
      setPhotos(prev => ({
        ...prev,
        [currentPhotoType]: {
          image: imageSrc,
          location: currentLocation
        }
      }));

      setShowCamera(false);
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error("Error taking photo:", error);
    }
  };

  // Component Camera với giao diện mới
  const CameraModal = () => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-transparent h-32" />
        
        <div className="relative p-4">
          <button
            onClick={() => setShowCamera(false)}
            className="text-white hover:text-red-500 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative flex-1">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-full object-cover"
        />

        {/* Location info */}
        {location && (
          <div className="absolute top-16 left-0 right-0 px-4">
            <div className="bg-black/50 p-3 rounded-lg inline-flex items-center">
              <FaMapMarkerAlt className="text-red-500 mr-2" />
              <p className="text-red-500 text-sm font-medium">
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </p>
            </div>
          </div>
        )}

        {/* Camera UI Controls */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Gradient overlay cho controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent h-48" />
          
          {/* Description above camera button */}
          <div className="relative px-6 pb-4">
            <div className="bg-black/50 p-3 rounded-lg mb-4 max-w-md mx-auto">
              <h3 className="text-white font-medium text-center mb-1">
                {photoTypes.find(type => type.type_id === currentPhotoType)?.name}
              </h3>
              <p className="text-gray-200 text-sm text-center">
                {currentPhotoDescription}
              </p>
            </div>

            {/* Camera button */}
            <div className="flex justify-center">
              <button
                onClick={handleTakePhoto}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/50"
              >
                <FaCamera size={24} className="text-gray-900" />
              </button>
            </div>
          </div>
        </div>

        {/* Guide lines overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full border-2 border-white/30 m-auto" />
        </div>
      </div>
    </div>
  );

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

  // Cập nhật hiển thị ảnh đã chụp
  const PhotoDisplay = ({ type, imageUrl }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
        <img
          src={imageUrl}
          alt={photoTypes.find((t) => t.type_id === type)?.title}
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="text-white text-center p-4">
            <p className="font-medium mb-2">Ảnh đã chụp</p>
            <p className="text-sm">Không thể thay đổi</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Cập nhật hàm handleSubmit để xử lý trạng thái
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Upload ảnh
      const photoUploadPromises = Object.entries(photos).map(([type, data]) => {
        if (data) {
          return fetch(
            `https://ten-p521.onrender.com/store-audit-images/${storeId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                image_url: data.image,
                image_type: type,
                location: data.location,
                event_id: eventId,
              }),
            }
          );
        }
        return Promise.resolve();
      });

      await Promise.all(photoUploadPromises);

      // Cập nhật trạng thái cửa hàng
      await fetch(`https://ten-p521.onrender.com/store-event-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_id: storeId,
          eventid: eventId,
          status_type: "Đang chờ duyệt",
        }),
      });

      setHasUnsavedChanges(false);
      alert("Cập nhật thông tin thành công!");
      navigate(`/store-gallery/${eventId}/${storeId}`);
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin!");
    } finally {
      setLoading(false);
    }
  };

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
                  <div className="md:w-2/3">
                    {photos[type.type_id] ? (
                      <PhotoDisplay
                        type={type.type_id}
                        imageUrl={photos[type.type_id].image}
                      />
                    ) : (
                      <button
                        onClick={() => handleCapture(type.type_id)}
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
        {showCamera && <CameraModal />}

        {/* Submit Button */}
        {Object.values(photos).some((photo) => photo) && (
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
    </div>
  );
}

export default StorePhotoCapture;
