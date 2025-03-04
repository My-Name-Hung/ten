import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavigationPopup from "../Popup/NavigationPopup";
import "./login.css";
// import component

import logoTen from "../../assets/Footer/logo-ten.jpg";
import logo1 from "../../assets/Footer/logo1.png";
import logoText from "../../assets/Footer/logotext.png";
// import assets
import fantadau from "../../assets/AboutUs/fantadau.jpg";
import logo from "../../assets/AboutUs/Logo_Coke.png";

// import icon
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineSwapRight,
} from "react-icons/ai";
import { BsFillShieldLockFill } from "react-icons/bs";
import { FaUserShield } from "react-icons/fa";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handleLogin = async (userData) => {
    try {
      // Lưu thông tin user vào localStorage
      localStorage.setItem("token", userData.token);
      localStorage.setItem("username", userData.username);
      localStorage.setItem("role", userData.role);

      // Kiểm tra nếu cần đổi mật khẩu
      if (userData.mustChangePassword) {
        navigate("/doi-mat-khau");
        return;
      }

      // Điều hướng dựa trên role
      switch (userData.role) {
        case 'SR':
        case 'SO':
          setShowPopup(true); // Hiển thị NavigationPopup cho SR và SO
          break;
        case 'TSM':
          navigate("/tsm-dashboard");
          break;
        case 'ASM':
          navigate("/asm-dashboard");
          break;
        default:
          throw new Error("Không xác định được quyền truy cập");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("https://ten-p521.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: event.target.username.value,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!");
      }

      await handleLogin(data);
      
    } catch (error) {
      setError(error.message);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="loginPage flex">
        <div className="container bg-red-600 flex">
          <div className="videoDiv">
            <img src={fantadau} alt="fantadau" />
            <div className="textDiv"></div>
          </div>

          <div className="formDiv flex">
            <div className="headerDiv">
              <img src={logo} alt="Logo" />
            </div>

            <form onSubmit={handleSubmit} className="form grid">
              <div className="inputDiv block">
                <label htmlFor="username">
                  Tên đăng nhập <sup>*</sup>
                </label>
                <div className="input flex">
                  <FaUserShield className="icon" />
                  <input
                    type="text"
                    id="username"
                    placeholder="Tên đăng nhập"
                    required
                  />
                </div>
              </div>

              <div className="inputDiv block">
                <label htmlFor="password">
                  Mật khẩu <sup>*</sup>
                </label>
                <div className="input flex">
                  <BsFillShieldLockFill className="icon" />
                  <input
                    type={passwordVisible ? "text" : "password"}
                    id="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="passwordToggleBtn"
                  >
                    {passwordVisible ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>

                {error && (
                  <div className="text-red-500 pt-4 max-w-[20rem]">{error}</div>
                )}

                <button
                  type="submit"
                  className="btn bg-red-900 flex"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang đăng nhập...
                    </span>
                  ) : (
                    <>
                      <span>Đăng nhập</span>
                      <AiOutlineSwapRight className="icon" />
                    </>
                  )}
                </button>

                <span className="forgotPassword">
                  <a href="#" className="text-gray-300 hover:text-white">
                    Quên mật khẩu? <br />
                    Liên hệ MKT hoặc TSM để được hỗ trợ
                  </a>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-red-600 top-0 text-center flex justify-between items-center">
        <div className="bg-red-600 flex items-center">
          <a
            rel="noopener noreferrer"
            className="text-[#007bff] bg-transparent"
            href="https://tengroup.com.vn/"
            target="_blank"
          >
            <img src={logoTen} alt="logo" className="h-[20px]" />
          </a>
        </div>
        <div className="items-center justify-between text-white flex">
          <span>© Copyright 2024</span>
          <a
            rel="noopener noreferrer"
            className="text-[#007bff] bg-transparent"
            href="https://tengroup.com.vn/"
            target="_blank"
          >
            <img src={logo1} alt="logo" className="w-[20px] object-contain" />
            <img
              src={logoText}
              alt="logo"
              className="w-[12px] object-contain"
            />
          </a>
        </div>
      </footer>

      {/* Navigation Popup */}
      <NavigationPopup 
        isOpen={showPopup} 
        onClose={() => setShowPopup(false)} 
      />
    </>
  );
};

export default Login;
