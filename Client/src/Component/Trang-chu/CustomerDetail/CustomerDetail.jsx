import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEdit, FaSave, FaTimes, FaMedal, FaCheck, FaExclamationCircle, FaPlus, FaMinus, FaImage } from 'react-icons/fa';
import Navbar from '../Navbar/navBar';
import Footer from '../../Footer/Footer';
import AddressForm from './AddressForm/AddressForm';
import StoreImages from './StoreImages/StoreImages';
import StoreMap from './StoreMap/StoreMap';
import './CustomerDetail.css';

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);
  const [editingFields, setEditingFields] = useState({
    address: false,
    mobilephone: false,
    store_rank: false
  });
  const [editedData, setEditedData] = useState({
    address: '',
    mobilephone: '',
    store_rank: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [assetData, setAssetData] = useState([]);
  const [expandedAssets, setExpandedAssets] = useState({});
  const [storeEvents, setStoreEvents] = useState([]);

  useEffect(() => {
    fetchStoreData();
    if (id) {
      fetchAssetData();
      fetchStoreEvents();
    }
  }, [id]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://ten-p521.onrender.com/store-info/${id}`);
      if (!response.ok) throw new Error('Không thể tải thông tin cửa hàng');
      const data = await response.json();
      setStoreData(data);
      setEditedData({
        address: data.address || '',
        mobilephone: data.mobilephone || '',
        store_rank: data.store_rank || ''
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetData = async () => {
    try {
      const response = await fetch(`https://ten-p521.onrender.com/store-assets/${id}`);
      if (!response.ok) throw new Error('Không thể tải thông tin tài sản');
      const data = await response.json();
      
      // Nhóm tài sản theo loại đối tượng
      const groupedAssets = data.reduce((acc, asset) => {
        if (!acc[asset.loaidoituong]) {
          acc[asset.loaidoituong] = [];
        }
        acc[asset.loaidoituong].push(asset);
        return acc;
      }, {});
      
      setAssetData(groupedAssets);
    } catch (error) {
      console.error('Error fetching asset data:', error);
    }
  };

  const fetchStoreEvents = async () => {
    try {
      const response = await fetch(`https://ten-p521.onrender.com/store-events/${id}`);
      if (!response.ok) throw new Error('Không thể tải thông tin sự kiện');
      const data = await response.json();
      setStoreEvents(data);
    } catch (error) {
      console.error('Error fetching store events:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      // Parse địa chỉ để lấy các thành phần
      const addressParts = editedData.address.split(', ');
      const [streetNumber, district, ward, province] = addressParts;

      const response = await fetch(`https://ten-p521.onrender.com/store-info/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: editedData.address,
          mobilephone: editedData.mobilephone,
          store_rank: editedData.store_rank,
          province: province,
          district: district,
          ward: ward
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStoreData({
          ...storeData,
          ...editedData,
          province: province,
          district: district,
          ward: ward
        });
        setEditingFields({});
        setHasChanges(false);
        
        // Hiển thị notification
        setNotification({ show: true, message: 'Cập nhật thông tin thành công!' });
        
        // Tự động ẩn sau 3 giây
        setTimeout(() => {
          setNotification({ show: false, message: '' });
        }, 3000);
      } else {
        setNotification({ show: true, message: data.error || 'Cập nhật thất bại' });
        setTimeout(() => {
          setNotification({ show: false, message: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating store:', error);
      setNotification({ show: true, message: 'Đã xảy ra lỗi khi cập nhật' });
      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 3000);
    }
  };

  const handleCancel = () => {
    setEditingFields({
      address: false,
      mobilephone: false,
      store_rank: false
    });
    setEditedData({
      address: storeData.address,
      mobilephone: storeData.mobilephone,
      store_rank: storeData.store_rank
    });
    setHasChanges(false);
  };

  const toggleEdit = (field) => {
    setEditingFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    setHasChanges(true);
  };

  const handleChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const renderRankIcon = (rank) => {
    switch (rank?.toLowerCase()) {
      case 'vàng':
      case 'gold':
        return <FaMedal className="text-2xl text-yellow-500" />;
      case 'bạc':
      case 'silver':
        return <FaMedal className="text-2xl text-gray-400" />;
      case 'đồng':
      case 'bronze':
        return <FaMedal className="text-2xl text-amber-700" />;
      default:
        return <FaMedal className="text-2xl text-gray-300" />;
    }
  };

  const toggleAssetType = (assetType) => {
    setExpandedAssets(prev => ({
      ...prev,
      [assetType]: !prev[assetType]
    }));
  };

  const getStatusColor = (status) => {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'đạt':
        return 'bg-green-100 text-green-800';
      case 'không đạt':
        return 'bg-red-100 text-red-800';
      case 'đang chờ duyệt':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleEventClick = (eventId) => {
    // Navigate to EventDetail with store filter
    navigate(`/event-detail/${eventId}?store=${id}`);
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex justify-center items-center">
        <div className="text-red-600">{error}</div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div>
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-100 text-black px-6 py-3 rounded-lg shadow-lg flex items-center">
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Store Header with Channel Info */}
        <div className="mb-8">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-red-700 sm:text-3xl md:text-4xl">
              {storeData?.name}
            </h1>
          </div>
          
          {/* Store ID and Channel Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Store ID */}
              <div className="flex flex-col items-center sm:items-start space-y-1">
                <span className="text-sm text-gray-500">Mã cửa hàng</span>
                <span className="text-lg font-medium text-gray-900">
                  {storeData?.store_id}
                </span>
              </div>
              
              {/* Channel Info */}
              <div className="flex flex-col items-center sm:items-start space-y-1">
                <span className="text-sm text-gray-500">Kênh</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-medium text-gray-900">
                    {storeData?.channel || 'Chưa có thông tin'}
                  </span>
                  {storeData?.channel_fk && (
                    <>
                      <span className="text-gray-900">-</span>
                      <span className="text-lg font-medium text-gray-900">
                        {storeData.channel_fk}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Right Column: Images and Map */}
          <div className="space-y-8">
            {/* Store Images Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <FaImage className="text-red-600 text-xl" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Hình ảnh cửa hàng
                  </h2>
                </div>
                <StoreImages storeId={id} />
              </div>
            </div>

            {/* Store Map Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-blue-900 mb-6">
                  Vị trí cửa hàng
                </h2>
                <StoreMap storeData={storeData} />
              </div>
            </div>
          </div>

          {/* Store Information Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-6">
                Thông tin chung
              </h2>

              <div className="space-y-6">
                {/* Thông tin liên hệ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Địa chỉ */}
                  <div className="col-span-2">
                    <div className="group relative">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Địa chỉ
                        </label>
                        <button
                          onClick={() => {
                            toggleEdit('address');
                            setShowAddressForm(true);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            editingFields.address 
                              ? 'bg-green-100 text-green-600' 
                              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {editingFields.address ? <FaCheck /> : <FaEdit />}
                        </button>
                      </div>
                      {!editingFields.address ? (
                        <p className="text-gray-900 py-2">{storeData?.address}</p>
                      ) : (
                        <>
                          <p className="text-gray-900 py-2">{editedData.address}</p>
                          {showAddressForm && (
                            <AddressForm
                              region={storeData?.region}
                              currentAddress={editedData.address}
                              onAddressChange={(newAddress) => {
                                handleChange('address', newAddress);
                                setShowAddressForm(false);
                              }}
                              onCancel={() => setShowAddressForm(false)}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="col-span-2 md:col-span-1">
                    <div className="group relative">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số điện thoại
                        </label>
                        <button
                          onClick={() => toggleEdit('mobilephone')}
                          className={`p-2 rounded-full transition-colors ${
                            editingFields.mobilephone 
                              ? 'bg-green-100 text-green-600' 
                              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {editingFields.mobilephone ? <FaCheck /> : <FaEdit />}
                        </button>
                      </div>
                      {editingFields.mobilephone ? (
                        <input
                          type="text"
                          value={editedData.mobilephone}
                          onChange={(e) => handleChange('mobilephone', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          placeholder="Nhập số điện thoại..."
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{storeData?.mobilephone}</p>
                      )}
                    </div>
                  </div>

                  {/* Hạng */}
                  <div className="col-span-2 md:col-span-1">
                    <div className="group relative">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hạng
                        </label>
                        <button
                          onClick={() => toggleEdit('store_rank')}
                          className={`p-2 rounded-full transition-colors ${
                            editingFields.store_rank 
                              ? 'bg-green-100 text-green-600' 
                              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {editingFields.store_rank ? <FaCheck /> : <FaEdit />}
                        </button>
                      </div>
                      {editingFields.store_rank ? (
                        <select
                          value={editedData.store_rank}
                          onChange={(e) => handleChange('store_rank', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        >
                          <option value="">Chọn hạng</option>
                          <option value="Vàng">Vàng</option>
                          <option value="Bạc">Bạc</option>
                          <option value="Đồng">Đồng</option>
                        </select>
                      ) : (
                        <div className="flex items-center py-2">
                          {renderRankIcon(storeData?.store_rank)}
                          <span className="ml-2 text-gray-900">
                            {storeData?.store_rank || 'Chưa xếp hạng'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Moved here */}
                  {hasChanges && (
                    <div className="col-span-2 mt-4 flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        onClick={handleSubmit}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <FaSave className="mr-2" />
                        Lưu thay đổi
                      </button>
                      <button
                        onClick={handleCancel}
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <FaTimes className="mr-2" />
                        Hủy
                      </button>
                    </div>
                  )}
                </div>

                {/* Thông tin quản lý - New Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Thông tin quản lý
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NPP Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">NPP: </span>
                        <span className="text-gray-900">
                          {storeData?.npp_name} 
                          <span className="text-gray-500 ml-1">[{storeData?.npp_code}]</span>
                        </span>
                      </div>
                    </div>

                    {/* ASM Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">ASM: </span>
                        <span className="text-gray-900">
                          {storeData?.asm_name}
                          <span className="text-gray-500 ml-1">[{storeData?.asm_code}]</span>
                        </span>
                      </div>
                    </div>

                    {/* TSM Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">TSM: </span>
                        <span className="text-gray-900">
                          {storeData?.tsm_name}
                          <span className="text-gray-500 ml-1">[{storeData?.tsm_code}]</span>
                        </span>
                      </div>
                    </div>

                    {/* SR Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">SR: </span>
                        <span className="text-gray-900">
                          {storeData?.sr_name}
                          <span className="text-gray-500 ml-1">[{storeData?.sr_code}]</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin tài sản section */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Thông tin tài sản
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(assetData).map(([assetType, assets]) => (
                      <div key={assetType} className="bg-gray-50 rounded-lg overflow-hidden">
                        <div 
                          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleAssetType(assetType)}
                        >
                          <h4 className="text-base font-medium text-gray-800">
                            {assetType}
                          </h4>
                          <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                            {expandedAssets[assetType] ? (
                              <FaMinus className="text-gray-600" />
                            ) : (
                              <FaPlus className="text-gray-600" />
                            )}
                          </button>
                        </div>

                        {expandedAssets[assetType] && (
                          <div className="px-4 pb-4">
                            {assets.map((asset) => (
                              <div 
                                key={asset.mataisan}
                                className="mt-3 grid grid-cols-2 gap-4 text-sm"
                              >
                                <div className="space-y-2">
                                  <p>
                                    <span className="font-medium text-gray-700">Mã tài sản:</span>{' '}
                                    <span className="text-gray-900">{asset.mataisan}</span>
                                  </p>
                                  <p>
                                    <span className="font-medium text-gray-700">Seri:</span>{' '}
                                    <span className="text-gray-900">{asset.seri}</span>
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p>
                                    <span className="font-medium text-gray-700">Loại:</span>{' '}
                                    <span className="text-gray-900">{asset.loai}</span>
                                  </p>
                                  <p>
                                    <span className="font-medium text-gray-700">Tình trạng:</span>{' '}
                                    <span className={`
                                      ${asset.tinhtrang.toLowerCase() === 'còn' ? 'text-green-600' : ''}
                                      ${asset.tinhtrang.toLowerCase() === 'mất' ? 'text-red-600' : ''}
                                      ${asset.tinhtrang.toLowerCase() === 'di dời' ? 'text-yellow-600' : ''}
                                      ${asset.tinhtrang.toLowerCase().includes('sửa') ? 'text-orange-600' : ''}
                                    `}>
                                      {asset.tinhtrang}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-blue-900 mb-6">
                    Chương trình tham gia
                  </h2>
                  
                  <div className="grid gap-4">
                    {storeEvents.length > 0 ? (
                      storeEvents.map((event) => (
                        <div 
                          key={event.eventid}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleEventClick(event.eventid)}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Event Name */}
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                {event.event_name}
                              </h3>
                            </div>

                            {/* Status and Remaining Time */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                              {/* Status Badge */}
                              <span className={`
                                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                ${getStatusColor(event.status)}
                              `}>
                                {event.status || ''}
                              </span>

                              {/* Remaining Time */}
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <svg 
                                  className="w-4 h-4" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>
                                  {event.days_remaining > 0 
                                    ? `Còn ${event.days_remaining} ngày`
                                    : 'Đã kết thúc'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Event Time Range */}
                          <div className="mt-2 text-sm text-gray-500">
                            {new Date(event.start_time).toLocaleDateString('vi-VN')} 
                            {' - '} 
                            {new Date(event.end_time).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">
                          Cửa hàng chưa tham gia sự kiện nào
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </div>
  );
}

export default CustomerDetail; 