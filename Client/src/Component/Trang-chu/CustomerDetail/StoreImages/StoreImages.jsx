import React, { useEffect, useState } from "react";
import { FaTimesCircle, FaImage } from "react-icons/fa";

const StoreImages = ({ storeId }) => {
  const [images, setImages] = useState({
    banghieu: null,
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
      const formattedImages = {
        banghieu: data.find((img) => img.image_type === "banghieu") || null,
        mattien: data.find((img) => img.image_type === "mattien") || null,
      };
      setImages(formattedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      setError("Không thể tải hình ảnh");
    }
  };

  const getImageLabel = (type) => {
    return type === "banghieu" ? "Hình bảng hiệu" : "Hình mặt tiền";
  };

  return (
    <div className="w-full">
      {/* Image Circles Container */}
      <div className="flex gap-4 items-center">
        {["banghieu", "mattien"].map((type) => (
          <div key={type} className="relative group">
            {images[type] ? (
              // Circular Image Container with Hover Effect
              <div 
                className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden cursor-pointer transform transition-all duration-300 hover:ring-4 hover:ring-red-400 hover:ring-opacity-50"
                onClick={() => setSelectedImage(images[type])}
              >
                {/* Thumbnail Image */}
                <img
                  src={images[type].image_url}
                  alt={getImageLabel(type)}
                  className="w-full h-full object-cover"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Xem
                  </span>
                </div>
              </div>
            ) : (
              // Placeholder Circle for Missing Image
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex flex-col items-center justify-center transition-all duration-300 hover:bg-gray-200">
                <FaImage className="w-6 h-6 text-gray-400" />
                <p className="text-xs text-gray-500 mt-1">{type === "banghieu" ? "BH" : "MT"}</p>
              </div>
            )}
            {/* Image Label Below Circle */}
            <p className="text-xs text-gray-600 text-center mt-2">
              {type === "banghieu" ? "Bảng hiệu" : "Mặt tiền"}
            </p>
          </div>
        ))}
      </div>

      {/* Modal for Full Image View */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full mx-auto">
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors z-50"
            >
              <FaTimesCircle size={24} />
            </button>

            {/* Image Container */}
            <div 
              className="relative rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.image_url}
                alt={getImageLabel(selectedImage.image_type)}
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
              
              {/* Image Caption */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-center text-sm md:text-base font-medium">
                  {getImageLabel(selectedImage.image_type)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default StoreImages;
