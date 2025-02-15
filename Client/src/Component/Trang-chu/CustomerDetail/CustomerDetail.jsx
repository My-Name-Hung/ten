import React, { useEffect, useState } from "react";
import { FaCheck, FaEdit, FaMedal, FaSave, FaTimes } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import AddressForm from "../../AddressForm/AddressForm";
import Footer from "../../Footer/Footer";
import StoreImages from "../../StoreImages/StoreImages";
import Navbar from "../Navbar/navBar";
import "./CustomerDetail.css";

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);
  const [editingFields, setEditingFields] = useState({
    address: false,
    mobilephone: false,
    store_rank: false,
  });
  const [editedData, setEditedData] = useState({
    address: "",
    mobilephone: "",
    store_rank: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, [id]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://ten-p521.onrender.com/store-info/${id}`
      );
      if (!response.ok) throw new Error("Không thể tải thông tin cửa hàng");
      const data = await response.json();
      setStoreData(data);
      setEditedData({
        address: data.address || "",
        mobilephone: data.mobilephone || "",
        store_rank: data.store_rank || "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Parse địa chỉ để lấy các thành phần
      const addressParts = editedData.address.split(", ");
      const [streetNumber, district, ward, province] = addressParts;

      const response = await fetch(
        `https://ten-p521.onrender.com/store-info/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: editedData.address,
            mobilephone: editedData.mobilephone,
            store_rank: editedData.store_rank,
            province: province,
            district: district,
            ward: ward,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setStoreData({
          ...storeData,
          ...editedData,
          province: province,
          district: district,
          ward: ward,
        });
        setEditingFields({});
        setHasChanges(false);

        // Hiển thị notification
        setNotification({
          show: true,
          message: "Cập nhật thông tin thành công!",
        });

        // Tự động ẩn sau 3 giây
        setTimeout(() => {
          setNotification({ show: false, message: "" });
        }, 3000);
      } else {
        setNotification({
          show: true,
          message: data.error || "Cập nhật thất bại",
        });
        setTimeout(() => {
          setNotification({ show: false, message: "" });
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating store:", error);
      setNotification({ show: true, message: "Đã xảy ra lỗi khi cập nhật" });
      setTimeout(() => {
        setNotification({ show: false, message: "" });
      }, 3000);
    }
  };

  const handleCancel = () => {
    setEditingFields({
      address: false,
      mobilephone: false,
      store_rank: false,
    });
    setEditedData({
      address: storeData.address,
      mobilephone: storeData.mobilephone,
      store_rank: storeData.store_rank,
    });
    setHasChanges(false);
  };

  const toggleEdit = (field) => {
    setEditingFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    setHasChanges(true);
  };

  const handleChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const renderRankIcon = (rank) => {
    switch (rank?.toLowerCase()) {
      case "vàng":
      case "gold":
        return <FaMedal className="text-2xl text-yellow-500" />;
      case "bạc":
      case "silver":
        return <FaMedal className="text-2xl text-gray-400" />;
      case "đồng":
      case "bronze":
        return <FaMedal className="text-2xl text-amber-700" />;
      default:
        return <FaMedal className="text-2xl text-gray-300" />;
    }
  };

  if (loading)
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
        <Footer />
      </div>
    );

  if (error)
    return (
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
              <span className="text-sm font-medium">
                {notification.message}
              </span>
            </div>
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

          {/* Store Images Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Hình ảnh cửa hàng
              </h2>
              <StoreImages storeId={id} />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Store Information Card */}
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
                        onClick={() => {
                          toggleEdit("address");
                          setShowAddressForm(true);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          editingFields.address
                            ? "bg-green-100 text-green-600"
                            : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {editingFields.address ? <FaCheck /> : <FaEdit />}
                      </button>
                    </div>
                    {!editingFields.address ? (
                      <p className="text-gray-900 py-2">{storeData?.address}</p>
                    ) : (
                      <>
                        <p className="text-gray-900 py-2">
                          {editedData.address}
                        </p>
                        {showAddressForm && (
                          <AddressForm
                            region={storeData?.region}
                            currentAddress={editedData.address}
                            onAddressChange={(newAddress) => {
                              handleChange("address", newAddress);
                              setShowAddressForm(false);
                            }}
                            onCancel={() => setShowAddressForm(false)}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="group relative">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại
                      </label>
                      <button
                        onClick={() => toggleEdit("mobilephone")}
                        className={`p-2 rounded-full transition-colors ${
                          editingFields.mobilephone
                            ? "bg-green-100 text-green-600"
                            : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {editingFields.mobilephone ? <FaCheck /> : <FaEdit />}
                      </button>
                    </div>
                    {editingFields.mobilephone ? (
                      <input
                        type="text"
                        value={editedData.mobilephone}
                        onChange={(e) =>
                          handleChange("mobilephone", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Nhập số điện thoại..."
                      />
                    ) : (
                      <p className="text-gray-900 py-2">
                        {storeData?.mobilephone}
                      </p>
                    )}
                  </div>

                  {/* Hạng */}
                  <div className="group relative">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hạng
                      </label>
                      <button
                        onClick={() => toggleEdit("store_rank")}
                        className={`p-2 rounded-full transition-colors ${
                          editingFields.store_rank
                            ? "bg-green-100 text-green-600"
                            : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {editingFields.store_rank ? <FaCheck /> : <FaEdit />}
                      </button>
                    </div>
                    {editingFields.store_rank ? (
                      <select
                        value={editedData.store_rank}
                        onChange={(e) =>
                          handleChange("store_rank", e.target.value)
                        }
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
                          {storeData?.store_rank || "Chưa xếp hạng"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {hasChanges && (
                  <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
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
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default CustomerDetail;
