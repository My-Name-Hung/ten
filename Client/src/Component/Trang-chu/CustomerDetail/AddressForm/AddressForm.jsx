import React, { useEffect, useState } from "react";

const AddressForm = ({ region, currentAddress, onAddressChange, onCancel }) => {
  const [streetNumber, setStreetNumber] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [provinces, setProvinces] = useState([]);

  // Log để debug
  useEffect(() => {
    console.log("Current region:", region);
  }, [region]);

  // Set provinces based on region
  useEffect(() => {
    if (region) {
      let provincesList = [];
      switch (region.toUpperCase()) {
        case "HCM":
          provincesList = ["Thành phố Hồ Chí Minh", "Bình Dương", "Đồng Nai"];
          break;
        case "CE":
          provincesList = [
            "Thành phố Đà Nẵng",
            "Bình Định",
            "Gia Lai",
            "Kon Tum",
            "Phú Yên",
            "Quảng Bình",
            "Quảng Nam",
            "Quảng Ngãi",
            "Quảng Trị",
            "Thừa Thiên Huế",
          ];
          break;
        case "MKD":
          provincesList = [
            "Thành phố Cần Thơ",
            "An Giang",
            "Bạc Liêu",
            "Bến Tre",
            "Cà Mau",
            "Đồng Tháp",
            "Hậu Giang",
            "Kiên Giang",
            "Long An",
            "Sóc Trăng",
            "Tiền Giang",
            "Trà Vinh",
            "Vĩnh Long",
          ];
          break;
        default:
          provincesList = [];
      }
      setProvinces(provincesList);
    }
  }, [region]);

  // Fetch districts when province changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (selectedProvince) {
        try {
          console.log("Fetching districts for province:", selectedProvince);
          const response = await fetch(
            `https://ten-p521.onrender.com/districts/${encodeURIComponent(
              selectedProvince
            )}`
          );
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const data = await response.json();
          console.log("Received districts:", data);
          setDistricts(Array.isArray(data) ? data : []);
          setSelectedDistrict("");
          setSelectedWard("");
        } catch (error) {
          console.error("Error fetching districts:", error);
          setDistricts([]);
        }
      } else {
        setDistricts([]);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    const fetchWards = async () => {
      if (selectedDistrict) {
        try {
          const district = districts.find((d) => d.name === selectedDistrict);
          if (district) {
            console.log("Fetching wards for district code:", district.id);
            const response = await fetch(
              `https://ten-p521.onrender.com/wards/${district.id}`
            );
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            const data = await response.json();
            console.log("Received wards:", data);
            setWards(Array.isArray(data) ? data : []);
            setSelectedWard("");
          }
        } catch (error) {
          console.error("Error fetching wards:", error);
          setWards([]);
        }
      } else {
        setWards([]);
      }
    };
    fetchWards();
  }, [selectedDistrict, districts]);

  // Parse current address if exists
  useEffect(() => {
    if (currentAddress) {
      const parts = currentAddress.split(", ");
      if (parts.length === 4) {
        setStreetNumber(parts[0]);
        setSelectedDistrict(parts[1]);
        setSelectedWard(parts[2]);
        setSelectedProvince(parts[3]);
      }
    }
  }, [currentAddress]);

  const handleSubmit = () => {
    if (streetNumber && selectedDistrict && selectedWard && selectedProvince) {
      const formattedAddress = `${streetNumber}, ${selectedDistrict}, ${selectedWard}, ${selectedProvince}`;
      onAddressChange(formattedAddress);
    }
  };

  return (
    <div className="space-y-4 mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số nhà, đường
          </label>
          <input
            type="text"
            value={streetNumber}
            onChange={(e) => setStreetNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            placeholder="Nhập số nhà, tên đường"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tỉnh/Thành phố
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Chọn Tỉnh/Thành phố</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quận/Huyện
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            disabled={!selectedProvince}
          >
            <option value="">Chọn Quận/Huyện</option>
            {districts.map((district) => (
              <option key={district.id} value={district.name}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phường/Xã
          </label>
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            disabled={!selectedDistrict}
          >
            <option value="">Chọn Phường/Xã</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.name}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            !streetNumber ||
            !selectedProvince ||
            !selectedDistrict ||
            !selectedWard
          }
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Xác nhận
        </button>
      </div>
    </div>
  );
};

export default AddressForm;
