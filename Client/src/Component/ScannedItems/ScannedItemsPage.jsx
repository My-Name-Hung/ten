import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBarcode, FaTimes, FaSearch, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import BarcodeScanner from '../BarcodeScanner/BarcodeScanner';
import Navbar from '../Trang-chu/Navbar/navBar';
import Footer from '../Footer/Footer';

const ScannedItemsPage = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [stores, setStores] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch stores and events data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stores
        const storesResponse = await fetch('https://ten-p521.onrender.com/store-info');
        const storesData = await storesResponse.json();
        setStores(Array.isArray(storesData) ? storesData : []);

        // Fetch events
        const eventsResponse = await fetch('https://ten-p521.onrender.com/events');
        const eventsData = await eventsResponse.json();
        setEvents(Array.isArray(eventsData) ? eventsData : []);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load all items
  useEffect(() => {
    const loadAllScannedItems = () => {
      const allItems = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('scannedItems_')) {
          try {
            const items = JSON.parse(localStorage.getItem(key));
            const [, storeId, eventId] = key.split('_');
            const itemsWithContext = items.map(item => ({
              ...item,
              storeId,
              eventId
            }));
            allItems.push(...itemsWithContext);
          } catch (error) {
            console.error('Error parsing items:', error);
          }
        }
      }
      return allItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    setScannedItems(loadAllScannedItems());
  }, []);

  // Filter items
  const filteredItems = scannedItems.filter(item => {
    const matchesSearch = item.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = filterStore === 'all' || item.storeId === filterStore;
    const matchesEvent = filterEvent === 'all' || item.eventId === filterEvent;
    return matchesSearch && matchesStore && matchesEvent;
  });

  const handleBarcodeDetected = async (data) => {
    setShowScanner(false);
    
    // Check if item already exists
    const existingItemIndex = scannedItems.findIndex(item => item.barcode === data.barcode);
    
    if (existingItemIndex === -1) {
      const newItem = {
        barcode: data.barcode,
        timestamp: new Date().toISOString(),
        storeId: data.storeId || 'unknown',
        eventId: data.eventId || 'unknown',
        status: 'Chưa có thông tin sản phẩm'
      };
      
      setScannedItems(prev => [newItem, ...prev]);
      setSelectedItem(newItem);
    } else {
      setSelectedItem(scannedItems[existingItemIndex]);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Danh sách sản phẩm</h1>
          <p className="text-gray-600">Tổng số: {filteredItems.length} sản phẩm</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm mã vạch..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Store Filter */}
            <div className="relative">
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
              >
                <option value="all">Tất cả cửa hàng</option>
                {stores.map(store => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.name} - {store.store_id}
                  </option>
                ))}
              </select>
              <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Event Filter */}
            <div className="relative">
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
              >
                <option value="all">Tất cả chương trình</option>
                {events.map(event => (
                  <option key={event.eventid} value={event.eventid}>
                    {event.event_name}
                  </option>
                ))}
              </select>
              <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Scan Button */}
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaBarcode />
              <span>Quét mã vạch</span>
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Sản phẩm đã quét</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredItems.map((item) => (
                  <div
                    key={`${item.barcode}_${item.timestamp}`}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedItem?.barcode === item.barcode
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">#{item.barcode}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Chưa có thông tin sản phẩm'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Cửa hàng: {item.storeId}</div>
                      <div>Chương trình: {item.eventId}</div>
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Không tìm thấy sản phẩm nào
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm h-full">
              {selectedItem ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Chi tiết sản phẩm</h2>
                    {selectedItem.productInfo?.image && (
                      <div 
                        className="w-16 h-16 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(selectedItem.productInfo.image)}
                      >
                        <img
                          src={selectedItem.productInfo.image}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Mã vạch</label>
                        <div className="mt-1 text-lg text-gray-900">{selectedItem.barcode}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Thời gian quét</label>
                        <div className="mt-1 text-gray-900">
                          {new Date(selectedItem.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Cửa hàng</label>
                        <div className="mt-1 text-gray-900">{selectedItem.storeId}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Trạng thái</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                            selectedItem.status === 'Chưa có thông tin sản phẩm'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {selectedItem.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Chương trình</label>
                        <div className="mt-1 text-gray-900">{selectedItem.eventId}</div>
                      </div>
                    </div>
                  </div>

                  {selectedItem.productInfo && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chi tiết</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(selectedItem.productInfo).map(([key, value]) => {
                          if (key === 'image') return null;
                          return (
                            <div key={key}>
                              <label className="text-sm font-medium text-gray-600 capitalize">
                                {key.replace(/_/g, ' ')}
                              </label>
                              <div className="mt-1 text-gray-900">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value, null, 2)
                                  : value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center text-gray-500">
                    <FaBarcode size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Chọn một sản phẩm để xem chi tiết</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showImageModal && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <FaTimes size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Product"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
    <Footer />
    </div>
  );
};

export default ScannedItemsPage; 