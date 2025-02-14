import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEdit, FaSave, FaTimes, FaMedal, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import Navbar from '../Navbar/navBar';
import Footer from '../../Footer/Footer';

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
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchStoreData();
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

  const handleSave = async () => {
    try {
      const response = await fetch(`https://ten-p521.onrender.com/store-info/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) throw new Error('Lỗi khi cập nhật thông tin');

      const updatedData = await response.json();
      setStoreData(updatedData);
      setEditingFields({
        address: false,
        mobilephone: false,
        store_rank: false
      });
      setHasChanges(false);
      
      // Hiển thị thông báo thành công
      setNotification({
        show: true,
        type: 'success',
        message: 'Cập nhật thông tin thành công!'
      });

      // Ẩn thông báo sau 3 giây
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);

    } catch (error) {
      // Hiển thị thông báo lỗi
      setNotification({
        show: true,
        type: 'error',
        message: 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại!'
      });

      // Ẩn thông báo lỗi sau 3 giây
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
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
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          } transition-all duration-300 transform ${
            notification.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
        >
          {notification.type === 'success' ? (
            <FaCheck className="text-green-500" />
          ) : (
            <FaExclamationCircle className="text-red-500" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification({ show: false, type: '', message: '' })}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Store Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
            {storeData?.name}
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Mã cửa hàng: {storeData?.store_id}
          </p>
        </div>

        {/* Information Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Thông tin chung
              </h2>

              <div className="space-y-6">
                {/* Địa chỉ */}
                <div className="group relative">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ
                    </label>
                    <button
                      onClick={() => toggleEdit('address')}
                      className={`p-2 rounded-full transition-colors ${
                        editingFields.address 
                          ? 'bg-green-100 text-green-600' 
                          : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {editingFields.address ? <FaCheck /> : <FaEdit />}
                    </button>
                  </div>
                  {editingFields.address ? (
                    <input
                      type="text"
                      value={editedData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="Nhập địa chỉ..."
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{storeData?.address}</p>
                  )}
                </div>

                {/* Số điện thoại */}
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

                {/* Hạng */}
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

              {/* Action Buttons */}
              {hasChanges && (
                <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={handleSave}
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
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </div>
  );
}

export default CustomerDetail; 