import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Reset.css";

//  Import icon
import {
  AiOutlineEyeInvisible,
  AiOutlineEye,
} from "react-icons/ai";

const Reset = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Validation checks
    if (!oldPassword) {
      alert("Vui lòng nhập mật khẩu cũ");
      return;
    }

    if (!newPassword) {
      alert("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword === oldPassword) {
      alert("Mật khẩu mới không được trùng với mật khẩu cũ");
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 10) {
      alert("Độ dài mật khẩu phải từ 6-10 ký tự");
      return;
    }

    // Updated password validation to only check for numbers
    const numberOnlyRegex = /^\d{6,10}$/;
    if (!numberOnlyRegex.test(newPassword)) {
      alert("Mật khẩu chỉ được chứa số và độ dài từ 6-10 số");
      return;
    }

    try {
      setIsLoading(true);
      const username = localStorage.getItem("username");
      const token = localStorage.getItem("token");

      if (!token || !username) {
        alert("Phiên đăng nhập đã hết hạn");
        return;
      }

      const response = await fetch(
        "https://ten-p521.onrender.com/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username, oldPassword, newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Mật khẩu cũ không đúng");
      }

      alert("Đổi mật khẩu thành công");
      navigate("/home");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert(error.message || "Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="resetPage">
      <div className="resetContainer">
        <h2>Đổi Mật Khẩu</h2>
        <form onSubmit={handleSubmit} className="resetForm">
          <div className="inputGroup">
            <label htmlFor="oldPassword">Mật khẩu cũ</label>
            <div className="passwordWrapper">
              <input
                type={showOldPassword ? "text" : "password"}
                id="oldPassword"
                placeholder="Nhập mật khẩu cũ"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="togglePassword"
                onClick={() => setShowOldPassword((prev) => !prev)}
              >
                {showOldPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </div>
          <div className="inputGroup">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <div className="passwordWrapper">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="togglePassword"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </div>
          <div className="inputGroup">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <div className="passwordWrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="togglePassword"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? (
                  <AiOutlineEyeInvisible />
                ) : (
                  <AiOutlineEye />
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="resetButton" disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Reset;
