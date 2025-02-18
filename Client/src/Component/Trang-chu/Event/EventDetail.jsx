import React, { useEffect, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { IoReturnDownBack } from "react-icons/io5";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Footer from "../../Footer/Footer";
import Navbar from "../Navbar/navBar";

// Cập nhật STATUS_MAPPING để xử lý trường hợp trống
const STATUS_MAPPING = {
  'Đang chờ duyệt': { label: 'Đang chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
  'Đạt': { label: 'Đạt', color: 'bg-green-100 text-green-800' },
  'Không đạt': { label: 'Không đạt', color: 'bg-red-100 text-red-800' },  // Sửa từ 'Rớt' thành 'Không đạt'
  'Làm lại': { label: 'Làm lại', color: 'bg-blue-100 text-blue-800' },
  '': { label: '', color: '' }
};

function EventDetail() {
  const { eventId } = useParams();
  const [eventDetails, setEventDetails] = useState(null);
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filteredStoreId = searchParams.get('store');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        // Fetch event details
        const eventResponse = await fetch(`https://ten-p521.onrender.com/events/${eventId}`);
        const eventData = await eventResponse.json();
        setEventDetails(eventData);

        // Fetch stores for this event
        const storesResponse = await fetch(`https://ten-p521.onrender.com/event-stores/${eventId}`);
        const storesData = await storesResponse.json();
        
        console.log("Stores data:", storesData); // Thêm log này để kiểm tra
        
        // Filter stores if storeId is provided
        const filteredData = filteredStoreId 
          ? storesData.filter(store => store.store_id === filteredStoreId)
          : storesData;
        
        setStores(filteredData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, filteredStoreId]);

  // Filter stores based on search and status
  const filteredStores = stores.filter(store => {
    const matchSearch = (
      store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.store_id?.toString().includes(searchTerm) ||
      store.mobilephone?.includes(searchTerm) ||
      store.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchStatus = statusFilter === "all" ? true : store.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const clearStoreFilter = () => {
    // Remove store parameter and refresh list
    setSearchParams({});
  };

  const handleReturn = () => {
    // Extract store_id from URL params
    const storeId = searchParams.get('store');
    if (storeId) {
      navigate(`/customer-detail/${storeId}`);
    }
  };

  const handleStoreClick = async (storeId) => {
    try {
      // Kiểm tra xem cửa hàng đã có ảnh chưa
      const response = await fetch(`https://ten-p521.onrender.com/store-audit-images/${storeId}/${eventId}`);
      const data = await response.json();

      if (data && data.length > 0) {
        // Nếu đã có ảnh, chuyển đến trang Gallery
        navigate(`/store-gallery/${eventId}/${storeId}`);
      } else {
        // Nếu chưa có ảnh, chuyển đến trang chụp ảnh
        navigate(`/store-photo-capture/${eventId}/${storeId}`);
      }
    } catch (error) {
      console.error('Error checking store status:', error);
      // Nếu có lỗi, mặc định chuyển đến trang chụp ảnh
      navigate(`/store-photo-capture/${eventId}/${storeId}`);
    }
  };

  return (
    <div>
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Event Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Left side: Return button and Event name */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-4">
              {searchParams.get('store') && (
                <button
                  onClick={handleReturn}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm"
                >
                  <IoReturnDownBack className="w-5 h-5" />
                  <span className="text-sm font-medium">Quay lại</span>
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {eventDetails?.event_name}
              </h1>
            </div>
            {/* Add remaining time below event name */}
            <div className="flex items-center text-gray-600 text-lg">
              <span>
                {eventDetails?.days_remaining > 0 
                  ? (<>Thời gian còn lại: <span className="text-red-700 font-medium">{eventDetails.days_remaining}</span> ngày</>)
                  : 'Đã kết thúc'
                }
              </span>
            </div>
          </div>
          
          {/* Right side: Clear filter button */}
          {searchParams.get('store') && (
            <button
              onClick={clearStoreFilter}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <FaTimes className="w-4 h-4" />
              <span>Xem tất cả cửa hàng</span>
            </button>
          )}
        </div>

        {/* Search and Filter Section - Stack on mobile */}
        <div className="mb-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm cửa hàng..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
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

          {/* Status Filter */}
          <select
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-base bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="Đang chờ duyệt">Đang chờ duyệt</option>
            <option value="Đạt">Đạt</option>
            <option value="Rớt">Không đạt</option>
            <option value="Làm lại">Làm lại</option>
          </select>
        </div>

        {/* Stores List - Different layouts for mobile and desktop */}
        <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
          {filteredStores.map((store) => (
            <div
              key={store.store_id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleStoreClick(store.store_id)}
            >
              {/* Mobile Layout (List) */}
              <div className="flex md:hidden">
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={store.image_url || '/default-store.jpg'}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-red-800 text-base truncate mr-2">
                      {store.name}
                    </h3>
                    <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                      store.status ? STATUS_MAPPING[store.status]?.color : ''
                    }`}>
                      {store.status ? STATUS_MAPPING[store.status]?.label : ''}
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-600">Code: {store.store_id}</p>
                    <p className="text-sm text-gray-600">SĐT: {store.mobilephone}</p>
                    <p className="text-sm text-gray-600 truncate">
                      <div className="max-w-xs lg:max-w-md">
                        <p className="text-gray-900 break-words whitespace-pre-line leading-relaxed">
                          {store.address}
                        </p>
                      </div>
                    </p>
                  </div>
                </div>
              </div>

              {/* Tablet/Desktop Layout (Grid) */}
              <div className="hidden md:flex">
                <div className="w-1/3 min-w-[120px]">
                  <img
                    src={store.image_url || '/default-store.jpg'}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-2/3 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-red-800 line-clamp-1" title={store.name}>
                      {store.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      store.status ? STATUS_MAPPING[store.status]?.color : ''
                    }`}>
                      {store.status ? STATUS_MAPPING[store.status]?.label : ''}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Code: {store.store_id}</p>
                    <p className="text-sm text-gray-600">SĐT: {store.mobilephone}</p>
                    <p className="text-sm text-gray-600 line-clamp-2" title={store.address}>
                      <div className="max-w-xs lg:max-w-md">
                        <p className="text-gray-900 break-words whitespace-pre-line leading-relaxed">
                          Địa chỉ: {store.address}
                        </p>
                      </div>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

export default EventDetail; 