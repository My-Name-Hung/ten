import React, { useEffect, useState } from "react";
import { FaTimesCircle } from "react-icons/fa";

const StoreImages = ({ storeId }) => {
  const [images, setImages] = useState({
    tongquan: null,
    mattien: null,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStoreImages();
  }, [storeId]);

  const fetchStoreImages = async () => {
    try {
      const response = await fetch(
        `https://ten-p521.onrender.com/store-images/${storeId}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      // Chuyển đổi mảng thành object với key là image_type
      const formattedImages = {
        tongquan: data.find((img) => img.image_type === "tongquan") || null,
        mattien: data.find((img) => img.image_type === "mattien") || null,
      };
      setImages(formattedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      setError("Không thể tải hình ảnh");
    }
  };

  const getImageLabel = (type) => {
    return type === "tongquan" ? "Hình tổng quan" : "Hình mặt tiền";
  };

  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {["tongquan", "mattien"].map((type) => (
          <div key={type} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {getImageLabel(type)}
            </label>
            <div className="relative">
              {images[type] ? (
                <div className="relative">
                  <img
                    src={images[type].image_url}
                    alt={getImageLabel(type)}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(images[type])}
                  />
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-500">Chưa có hình ảnh</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal hiển thị hình ảnh phóng to */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors"
            >
              <FaTimesCircle size={24} />
            </button>
            <div className="text-center">
              <img
                src={selectedImage.image_url}
                alt={getImageLabel(selectedImage.image_type)}
                className="max-h-[80vh] max-w-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-white mt-2">
                {getImageLabel(selectedImage.image_type)}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default StoreImages;
