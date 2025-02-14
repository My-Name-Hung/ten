import React, { useEffect, useState } from "react";
import {FaTimes, FaCrown, FaSearch, FaMedal } from "react-icons/fa";
import { BsTrophyFill, } from "react-icons/bs";
import Navbar from "../Navbar/navBar";
import Footer from "../../Footer/Footer";
import { useNavigate } from 'react-router-dom';

function CustomerList() {
  const [storeInfo, setStoreInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const storesPerPage = 3;
  const [pageInputValue, setPageInputValue] = useState('');
  const [showPageInput, setShowPageInput] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://ten-p521.onrender.com/store-info");
        const data = await response.json();
        setStoreInfo(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setStoreInfo([]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStores = Array.isArray(storeInfo) ? storeInfo.filter(store => {
    const searchFields = [
      store.name,
      store.store_id?.toString(),
      store.shop_owner,
      store.telephone,
      store.mobilephone,
      store.address,
      store.district,
      store.province,
      store.region,
      store.channel,
      store.store_rank,
      store.npp_code,
      store.npp_name,
      store.sr_code,
      store.sr_name,
      store.tsm_code,
      store.tsm_name,
      store.asm_code,
      store.asm_name
    ].filter(Boolean).map(field => field?.toLowerCase() || '');

    return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
  }) : [];

  const indexOfLastStore = currentPage * storesPerPage;
  const indexOfFirstStore = indexOfLastStore - storesPerPage;
  const currentStores = filteredStores.slice(indexOfFirstStore, indexOfLastStore);
  const totalPages = Math.ceil(filteredStores.length / storesPerPage);

  // Hàm render icon theo rank
  const renderRankIcon = (rank) => {
    switch (rank?.toLowerCase()) {
      case 'vàng':
      case 'gold':
      case 'vang':
        return (
          <div className="flex items-center group" title="Hạng Vàng">
            <div className="relative">
              <FaMedal className="text-2xl mr-2 text-yellow-500 transform transition-all duration-200 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-600 opacity-50 blur-sm rounded-full group-hover:opacity-75 transition-opacity duration-200"></div>
            </div>
          </div>
        );
      case 'bạc':
      case 'silver':
      case 'bac':
        return (
          <div className="flex items-center group" title="Hạng Bạc">
            <div className="relative">
              <FaMedal className="text-2xl mr-2 text-gray-400 transform transition-all duration-200 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-500 opacity-50 blur-sm rounded-full group-hover:opacity-75 transition-opacity duration-200"></div>
            </div>
          </div>
        );
      case 'đồng':  
      case 'dong':
      case 'bronze':
        return (
          <div className="flex items-center group" title="Hạng Đồng">
            <div className="relative">
              <FaMedal className="text-2xl mr-2 text-amber-700 transform transition-all duration-200 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-800 opacity-50 blur-sm rounded-full group-hover:opacity-75 transition-opacity duration-200"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-400" title="Chưa xếp hạng">
            <FaMedal className="text-2xl mr-2 opacity-30" />
            <span className="font-medium">Đang cập nhật</span>
          </div>
        );
    }
  };

  // Hàm xử lý khi người dùng nhập số trang
  const handlePageInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setPageInputValue(value);
    }
  };

  // Hàm xử lý khi người dùng nhấn Enter
  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const pageNumber = parseInt(pageInputValue);
      if (pageNumber && pageNumber > 0 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
        setShowPageInput(false);
        setPageInputValue('');
      }
    } else if (e.key === 'Escape') {
      setShowPageInput(false);
      setPageInputValue('');
    }
  };

  // Hàm xử lý khi input mất focus
  const handlePageInputBlur = () => {
    setShowPageInput(false);
    setPageInputValue('');
  };

  // Thêm hàm xử lý click vào mã cửa hàng
  const handleStoreClick = (storeId) => {
    navigate(`/customer-detail/${storeId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow max-w-full mx-auto px-2 sm:px-6 lg:px-8 py-6 bg-gray-50">
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black text-center">
            Danh sách khách hàng
          </h2>
        </div>

        {/* Search Section */}
        <div className="mb-6 max-w-2xl mx-auto px-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mã, địa chỉ..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600 mb-4 px-2">
          Hiển thị {Math.min(indexOfLastStore, filteredStores.length)} / {filteredStores.length} cửa hàng
        </div>

        {/* Table Container with always visible scrollbar */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="overflow-x-auto scrollbar-always-visible relative" 
               style={{ 
                 WebkitOverflowScrolling: 'touch',
                 scrollbarWidth: 'auto',
                 scrollbarColor: '#808080 #EDF2F7',
                 paddingBottom: '12px'
               }}>
            <table className="w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-100">
                <tr>
                  {/* Sticky Code column - Auto width */}
                  <th scope="col" 
                      className="sticky left-0 z-20 bg-gray-100 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200"
                      style={{ 
                        width: 'auto',
                        minWidth: '80px',
                        backgroundColor: '#F3F4F6'
                      }}>
                    CODE
                  </th>
                  {/* Sticky Name column - Auto width */}
                  <th scope="col" 
                      className="sticky left-[80px] z-20 bg-gray-100 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200"
                      style={{ 
                        width: 'auto',
                        minWidth: '150px',
                        backgroundColor: '#F3F4F6'
                      }}>
                    Tên
                  </th>
                  {/* Auto-sized columns */}
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Chủ liên hệ</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Di Động</th>
                  <th scope="col" className="w-auto min-w-[200px] px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Địa Chỉ</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Quận/Huyện</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Tỉnh/TP</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Vùng</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Kênh</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Hạng</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">NPP Code</th>
                  <th scope="col" className="w-auto min-w-[150px] px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên NPP</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">SR Code</th>
                  <th scope="col" className="w-auto min-w-[150px] px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên SR</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">TSM Code</th>
                  <th scope="col" className="w-auto min-w-[150px] px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên TSM</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">ASM Code</th>
                  <th scope="col" className="w-auto min-w-[150px] px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên ASM</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentStores.map((store) => (
                  <tr key={store.store_id} className="hover:bg-gray-50">
                    {/* Sticky Code cell */}
                    <td 
                      className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-blue-600 whitespace-nowrap border-r cursor-pointer hover:text-red-600 transition-colors"
                      onClick={() => handleStoreClick(store.store_id)}
                      style={{ backgroundColor: '#FFFFFF' }}
                    >
                      {store.store_id}
                    </td>
                    {/* Sticky Name cell */}
                    <td className="sticky left-[80px] z-10 bg-white px-4 py-3 text-sm text-gray-900 whitespace-nowrap border-r border-gray-200"
                        style={{ backgroundColor: '#FFFFFF' }}>
                      {store.name}
                    </td>
                    {/* Auto-sized cells */}
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.shop_owner}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.mobilephone}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[200px] overflow-hidden text-ellipsis" title={store.address}>
                        {store.address}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.district}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.province}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.region}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.channel}</td>
                    <td className="px-4 py-3">{renderRankIcon(store.store_rank)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.npp_code}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[150px] overflow-hidden text-ellipsis" title={store.npp_name}>
                        {store.npp_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.sr_code}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[150px] overflow-hidden text-ellipsis" title={store.sr_name}>
                        {store.sr_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.tsm_code}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[150px] overflow-hidden text-ellipsis" title={store.tsm_name}>
                        {store.tsm_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.asm_code}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[150px] overflow-hidden text-ellipsis" title={store.asm_name}>
                        {store.asm_name}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Updated Pagination Section */}
        <div className="border-t border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <div className="flex items-center">
                <span 
                  className="text-sm text-gray-700 cursor-pointer hover:text-red-600"
                  onClick={() => setShowPageInput(true)}
                >
                  {showPageInput ? (
                    <input
                      type="text"
                      value={pageInputValue}
                      onChange={handlePageInputChange}
                      onKeyDown={handlePageInputKeyDown}
                      onBlur={handlePageInputBlur}
                      className="w-16 px-2 py-1 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder={currentPage}
                      autoFocus
                    />
                  ) : (
                    `Trang ${currentPage}`
                  )}
                </span>
                <span className="text-sm text-gray-700 mx-1">/</span>
                <span className="text-sm text-gray-700">{totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <div className="flex items-center">
                  <span 
                    className="text-sm text-gray-700 cursor-pointer hover:text-red-600"
                    onClick={() => setShowPageInput(true)}
                  >
                    {showPageInput ? (
                      <input
                        type="text"
                        value={pageInputValue}
                        onChange={handlePageInputChange}
                        onKeyDown={handlePageInputKeyDown}
                        onBlur={handlePageInputBlur}
                        className="w-16 px-2 py-1 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={currentPage}
                        autoFocus
                      />
                    ) : (
                      `Trang ${currentPage}`
                    )}
                  </span>
                  <span className="text-sm text-gray-700 mx-1">/</span>
                  <span className="text-sm text-gray-700">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Không tìm thấy cửa hàng nào
          </div>
        )}

        {/* Enhanced styles */}
        <style jsx>{`
          /* Force scrollbar to always show on mobile */
          .scrollbar-always-visible {
            -ms-overflow-style: -ms-autohiding-scrollbar;
            scrollbar-width: thin;
            overflow-x: scroll !important;
          }

          .scrollbar-always-visible::-webkit-scrollbar {
            -webkit-appearance: none;
            height: 8px !important;
            width: 8px;
            display: block !important;
          }

          .scrollbar-always-visible::-webkit-scrollbar-track {
            background: #EDF2F7;
            border-radius: 4px;
          }

          .scrollbar-always-visible::-webkit-scrollbar-thumb {
            background: #CBD5E0;
            border-radius: 4px;
            border: 2px solid #EDF2F7;
          }

          .scrollbar-always-visible::-webkit-scrollbar-thumb:hover {
            background: #A0AEC0;
          }

          /* Mobile specific styles */
          @media (max-width: 768px) {
            .scrollbar-always-visible {
              /* Force hardware acceleration */
              -webkit-transform: translateZ(0);
              -moz-transform: translateZ(0);
              -ms-transform: translateZ(0);
              -o-transform: translateZ(0);
              transform: translateZ(0);
              
              /* Ensure smooth scrolling */
              -webkit-overflow-scrolling: touch;
              scroll-padding-left: 230px;
              
              /* Always show scrollbar */
              overflow-x: scroll !important;
              scrollbar-width: thin !important;
            }

            .scrollbar-always-visible::-webkit-scrollbar {
              display: block !important;
              height: 8px !important;
            }
          }
        `}</style>
      </div>
    </div>
    <Footer />
    </div>
  );
}

export default CustomerList; 