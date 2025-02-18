import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { LuScanBarcode } from "react-icons/lu";

function NavigationPopup({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[90%] max-w-md transform transition-all">
        <h2 className="text-2xl font-bold text-red-800 text-center mb-6">
          Chọn Trang Để Tiếp Tục
        </h2>
        
        <div className="space-y-4">
          {/* Option 1: Danh sách khách hàng */}
          <button
            onClick={() => handleNavigation('/danh-sach-khach-hang')}
            className="w-full flex items-center p-4 bg-white border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors group"
          >
            <FaUsers className="text-2xl text-red-600 mr-4 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-red-800">
                Danh sách khách hàng
              </h3>
              <p className="text-sm text-gray-600">
                Xem và quản lý thông tin khách hàng
              </p>
            </div>
          </button>

          {/* Option 2: Danh sách chương trình */}
          <button
            onClick={() => handleNavigation('/event')}
            className="w-full flex items-center p-4 bg-white border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors group"
          >
            <FaCalendarAlt className="text-2xl text-red-600 mr-4 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-red-800">
                Danh sách chương trình
              </h3>
              <p className="text-sm text-gray-600">
                Xem và quản lý các chương trình
              </p>
            </div>
          </button>

          {/* Option 3: Danh sách sản phẩm */}
          <button
            onClick={() => handleNavigation('/scanned-items')}
            className="w-full flex items-center p-4 bg-white border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors group"
          >
            <LuScanBarcode className="text-2xl text-red-600 mr-4 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-red-800">
                Danh sách sản phẩm
              </h3>
              <p className="text-sm text-gray-600">
                Xem và quản lý các sản phẩm đã quét
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NavigationPopup; 