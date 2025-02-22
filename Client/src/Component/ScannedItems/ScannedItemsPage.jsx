import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBarcode, FaTimes, FaSearch, FaFilter, FaSortAmountDown, FaTrash } from 'react-icons/fa';
import BarcodeScanner from '../BarcodeScanner/BarcodeScanner';
import Navbar from '../Trang-chu/Navbar/navBar';
import Footer from '../Footer/Footer';
import Swal from 'sweetalert2';
import axios from 'axios';
import successSound from '../../assets/sounds/success-beep.mp3';

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
  const [selectedItems, setSelectedItems] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [isMultiScanActive, setIsMultiScanActive] = useState(false);
  const [processingBarcodes, setProcessingBarcodes] = useState(false);
  const successAudioRef = useRef(new Audio(successSound));
  const [selectAll, setSelectAll] = useState(false);

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

  // Hàm lấy thông tin sản phẩm từ Open Food Facts API
  const fetchProductInfo = async (barcode) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );

      if (response.data.status === 1) {
        const product = response.data.product;
        return {
          barcode: barcode,
          name: product.product_name || 'Chưa có tên',
          brand: product.brands || 'Chưa có thương hiệu',
          image: product.image_url,
          ingredients: product.ingredients_text_vi || product.ingredients_text || 'Chưa có thông tin',
          quantity: product.quantity || 'Không xác định',
          categories: product.categories_tags?.map(cat => cat.replace('vi:', '').replace('en:', '')).join(', ') || 'Chưa phân loại',
          nutriments: {
            energy: product.nutriments?.energy_100g || 'N/A',
            proteins: product.nutriments?.proteins_100g || 'N/A',
            carbohydrates: product.nutriments?.carbohydrates_100g || 'N/A',
            fat: product.nutriments?.fat_100g || 'N/A',
          }
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching product info:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật hàm handleMultipleBarcodes
  const handleMultipleBarcodes = async (barcodes) => {
    try {
      setProcessingBarcodes(true);
      
      // Lọc các mã vạch mới
      const newBarcodes = barcodes.filter(barcode => 
        !scannedItems.some(item => item.barcode === barcode)
      );

      if (newBarcodes.length > 0) {
        const newItems = [];
        // Xử lý từng mã vạch
        for (const barcode of newBarcodes) {
          try {
            const productInfo = await fetchProductInfo(barcode);
            
            const newItem = {
              barcode,
              timestamp: new Date().toISOString(),
              storeId: filterStore || 'unknown',
              eventId: filterEvent || 'unknown',
              status: 'Đã quét',
              productInfo: productInfo || {
                name: 'Sản phẩm chưa có trong cơ sở dữ liệu',
                brand: 'Không xác định',
                image: null,
                ingredients: 'Chưa có thông tin',
                quantity: 'Không xác định',
                categories: 'Chưa phân loại',
                nutriments: {
                  energy: 'N/A',
                  proteins: 'N/A',
                  carbohydrates: 'N/A',
                  fat: 'N/A',
                }
              }
            };

            newItems.push(newItem);

            // Phát âm thanh thành công
            try {
              successAudioRef.current.currentTime = 0;
              await successAudioRef.current.play();
            } catch (error) {
              console.error('Error playing sound:', error);
            }
          } catch (error) {
            console.error(`Error processing barcode ${barcode}:`, error);
          }
        }

        // Lưu vào localStorage
        const storageKey = `scannedItems_${filterStore || 'unknown'}_${filterEvent || 'unknown'}`;
        const existingItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedItems = [...newItems, ...existingItems];
        localStorage.setItem(storageKey, JSON.stringify(updatedItems));

        // Cập nhật state
        setScannedItems(prev => [...newItems, ...prev]);

        // Hiển thị thông báo thành công nhỏ gọn
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true
        });

        Toast.fire({
          icon: 'success',
          title: `Đã quét ${newItems.length} sản phẩm mới`
        });
      }
    } catch (error) {
      console.error('Error handling barcodes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Có lỗi xảy ra khi xử lý mã vạch'
      });
    } finally {
      setProcessingBarcodes(false);
    }
  };

  // Cập nhật MultiScanner component
  const MultiScanner = () => {
    if (!showScanner) return null;

    return (
      <BarcodeScanner
        onDetected={handleMultipleBarcodes}
        onClose={() => setShowScanner(false)}
        settings={{
          enableMultiScan: true,
          maxMultiScanCount: 50,
          multiScanTimeout: 200
        }}
      />
    );
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  // Thêm hàm xử lý chọn item
  const handleSelectItem = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.barcode === item.barcode);
      if (isSelected) {
        return prev.filter(selected => selected.barcode !== item.barcode);
      } else {
        return [...prev, item];
      }
    });
  };

  // Hàm xóa các items đã chọn
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Chưa chọn sản phẩm',
        text: 'Vui lòng chọn sản phẩm cần xóa',
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa ${selectedItems.length} sản phẩm đã chọn?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        // Xóa từ localStorage
        selectedItems.forEach(item => {
          const key = `scannedItems_${item.storeId}_${item.eventId}`;
          const existingItems = JSON.parse(localStorage.getItem(key) || '[]');
          const updatedItems = existingItems.filter(existing => existing.barcode !== item.barcode);
          
          if (updatedItems.length === 0) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, JSON.stringify(updatedItems));
          }
        });

        // Cập nhật state
        setScannedItems(prev => 
          prev.filter(item => !selectedItems.some(selected => selected.barcode === item.barcode))
        );
        setSelectedItems([]);

        Swal.fire({
          icon: 'success',
          title: 'Đã xóa thành công',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (error) {
        console.error('Error deleting items:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Không thể xóa sản phẩm. Vui lòng thử lại.',
        });
      }
    }
  };

  // Thêm hàm xử lý chọn tất cả
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      // Nếu chưa chọn tất cả, chọn tất cả các item đã lọc
      setSelectedItems(filteredItems);
    } else {
      // Nếu đã chọn tất cả, bỏ chọn tất cả
      setSelectedItems([]);
    }
  };

  // Cập nhật giao diện hiển thị sản phẩm
  const renderProductCard = (item) => {
    const { productInfo } = item;
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={selectedItems.some(selected => selected.barcode === item.barcode)}
              onChange={() => handleSelectItem(item)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {productInfo?.name || 'Sản phẩm chưa có trong CSDL'}
                </h3>
                <p className="text-sm text-gray-500">Mã vạch: {item.barcode}</p>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </div>

            {productInfo?.image && (
              <img
                src={productInfo.image}
                alt={productInfo.name}
                className="mt-2 w-32 h-32 object-cover rounded-lg cursor-pointer"
                onClick={() => handleImageClick(productInfo.image)}
              />
            )}

            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Thương hiệu:</p>
                <p className="font-medium">{productInfo?.brand || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Khối lượng:</p>
                <p className="font-medium">{productInfo?.quantity || 'N/A'}</p>
              </div>
            </div>

            {productInfo?.nutriments && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Thông tin dinh dưỡng (100g):</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <p className="text-sm">Năng lượng: {productInfo.nutriments.energy} kcal</p>
                  <p className="text-sm">Protein: {productInfo.nutriments.proteins}g</p>
                  <p className="text-sm">Carbs: {productInfo.nutriments.carbohydrates}g</p>
                  <p className="text-sm">Chất béo: {productInfo.nutriments.fat}g</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Thêm useEffect để xử lý âm thanh
  useEffect(() => {
    // Cấu hình âm thanh
    successAudioRef.current.volume = 0.5; // Điều chỉnh âm lượng (0.0 đến 1.0)
    
    // Cleanup khi component unmount
    return () => {
      successAudioRef.current.pause();
      successAudioRef.current.currentTime = 0;
    };
  }, []);

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
        {/* Header Section with Delete and Select All Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Danh sách sản phẩm</h1>
            <p className="text-gray-600">
              Đã chọn: {selectedItems.length} / Tổng số: {filteredItems.length} sản phẩm
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
            {selectedItems.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash className="mr-2" />
                Xóa đã chọn ({selectedItems.length})
              </button>
            )}
          </div>
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
              onClick={() => {
                setShowScanner(true);
                setIsMultiScanActive(false);
              }}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaBarcode />
              <span>Quét mã vạch</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={`${item.barcode}_${item.timestamp}`}>
              {renderProductCard(item)}
            </div>
          ))}
        </div>
      </main>

      {/* Modals */}
      {showScanner && (
        <MultiScanner />
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