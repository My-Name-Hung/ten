import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaSearch, FaTimes } from "react-icons/fa";
import Navbar from "../Navbar/navBar";
import Footer from "../../Footer/Footer";

// Cập nhật STATUS_MAPPING để phù hợp với dữ liệu từ database
const STATUS_MAPPING = {
  'Đang chờ duyệt': { label: 'Đang chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
  'Đạt': { label: 'Đạt', color: 'bg-green-100 text-green-800' },
  'Rớt': { label: 'Không đạt', color: 'bg-red-100 text-red-800' },
  'Làm lại': { label: 'Làm lại', color: 'bg-blue-100 text-blue-800' }
};

function EventDetail() {
  const { eventId } = useParams();
  const [eventDetails, setEventDetails] = useState(null);
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        // Fetch event details
        const eventResponse = await fetch(`http://localhost:3002/events/${eventId}`);
        const eventData = await eventResponse.json();
        setEventDetails(eventData);

        // Fetch stores for this event
        const storesResponse = await fetch(`http://localhost:3002/event-stores/${eventId}`);
        const storesData = await storesResponse.json();
        setStores(storesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  // Filter stores based on search and status
  const filteredStores = stores.filter(store => {
    const matchSearch = (
      store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.store_id?.toString().includes(searchTerm) ||
      store.mobilephone?.includes(searchTerm) ||
      store.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchStatus = statusFilter === "all" ? true : store.status_type === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div>
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow w-full px-4 py-6 bg-gray-50">
        {loading ? (
          <div className="text-center">Đang tải...</div>
        ) : (
          <>
            {/* Event Header - Responsive */}
            <div className="mb-6 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-red-800 mb-2">
                {eventDetails?.event_name}
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                Thời gian còn lại: {eventDetails?.days_remaining} ngày
              </p>
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
                  className="bg-white rounded-lg shadow-md overflow-hidden"
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
                        <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${STATUS_MAPPING[store.status_type]?.color || 'bg-yellow-100 text-yellow-800'}`}>
                          {STATUS_MAPPING[store.status_type]?.label || 'Đang chờ duyệt'}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600">Code: {store.store_id}</p>
                        <p className="text-sm text-gray-600">SĐT: {store.mobilephone}</p>
                        <p className="text-sm text-gray-600 truncate">{store.address}</p>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_MAPPING[store.status_type]?.color || 'bg-yellow-100 text-yellow-800'}`}>
                          {STATUS_MAPPING[store.status_type]?.label || 'Đang chờ duyệt'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Code: {store.store_id}</p>
                        <p className="text-sm text-gray-600">SĐT: {store.mobilephone}</p>
                        <p className="text-sm text-gray-600 line-clamp-2" title={store.address}>
                          Địa chỉ: {store.address}
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
          </>
        )}
      </div>
    </div>
    <Footer />
    </div>
  );
}

export default EventDetail; 