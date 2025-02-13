import React, { useEffect, useState } from "react";
import {FaTimes, FaCrown, FaSearch, FaMedal, FaSpinner } from "react-icons/fa";
import { BsTrophyFill, } from "react-icons/bs";
import Navbar from "../Navbar/navBar";
import Footer from "../../Footer/Footer";

function CustomerList() {
  const [storeInfo, setStoreInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const storesPerPage = 3;

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
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

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          {/* Scrollable Container with visible scrollbar */}
          <div className="overflow-x-auto scrollbar-visible" style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'auto',
            scrollbarColor: '#CBD5E0 #EDF2F7'
          }}>
            <div className="inline-block min-w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {/* Sticky ID column */}
                    <th scope="col" className="sticky left-0 bg-gray-100 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider shadow-sm z-10">
                      CODE
                    </th>
                    {/* Regular columns */}
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Tên</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Chủ liên hệ</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Di Động</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Địa Chỉ</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Quận/Huyện</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Tỉnh/TP</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Vùng</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Kênh</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Hạng</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">NPP Code</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Tên NPP</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">SR Code</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Tên SR</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">TSM Code</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Tên TSM</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">ASM Code</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Tên ASM</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStores.map((store) => (
                    <tr key={store.store_id} className="hover:bg-gray-50">
                      {/* Sticky ID column */}
                      <td className="sticky left-0 bg-white px-4 py-3 text-sm text-gray-900 whitespace-nowrap shadow-sm z-10">
                        {store.store_id}
                      </td>
                      {/* Regular columns */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-red-600 truncate max-w-[200px]" title={store.name}>
                          {store.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.shop_owner}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.mobilephone}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate max-w-[200px]" title={store.address}>
                          {store.address}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.district}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.province}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.region}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.channel}</td>
                      <td className="px-4 py-3">
                        {renderRankIcon(store.store_rank)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.npp_code}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate max-w-[200px]" title={store.npp_name}>
                          {store.npp_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.sr_code}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate max-w-[200px]" title={store.sr_name}>
                          {store.sr_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.tsm_code}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate max-w-[200px]" title={store.tsm_name}>
                          {store.tsm_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{store.asm_code}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate max-w-[200px]" title={store.asm_name}>
                          {store.asm_name}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination with mobile optimization */}
          <div className="border-t border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </span>
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
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Không tìm thấy cửa hàng nào
          </div>
        )}
      </div>  
    </div>
    <Footer />
    </div>
  );
}

// Add custom CSS for scrollbar styling
const styles = `
  .scrollbar-visible::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }

  .scrollbar-visible::-webkit-scrollbar-track {
    background: #EDF2F7;
  }

  .scrollbar-visible::-webkit-scrollbar-thumb {
    background: #CBD5E0;
    border-radius: 4px;
  }

  .scrollbar-visible::-webkit-scrollbar-thumb:hover {
    background: #A0AEC0;
  }
`;

// Add styles to head
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default CustomerList; 