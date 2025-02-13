import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";

// import component

import logoTen from "../../assets/Footer/logo-ten.jpg";
import logo1 from "../../assets/Footer/logo1.png";
import logoText from "../../assets/Footer/logotext.png";
// import assets
import video from "../../assets/AboutUs/video.mp4"
import logo from "../../assets/AboutUs/Logo_Coke.png";

// import icon
import { FaUserShield } from "react-icons/fa";
import { BsFillShieldLockFill } from "react-icons/bs";
import {
  AiOutlineSwapRight,
  AiOutlineEyeInvisible,
  AiOutlineEye,
} from "react-icons/ai";


const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const username = event.target.username.value;
    const password = event.target.password.value;

    try {
      const response = await fetch("https://ten-server.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      localStorage.setItem("username", username);
      
      if (data.mustChangePassword) {
        navigate("/doi-mat-khau");
      } else if (data.success) {
        navigate("/home");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="loginPage flex">
        <div className="container bg-red-600 flex">
          <div className="videoDiv">
            <video src={video} autoPlay muted loop></video>
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
                    onClick={togglePasswordVisibility}
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
                    "Signing in..."
                  ) : (
                    <>
                      <span>Đăng nhập</span>
                      <AiOutlineSwapRight className="icon" />
                    </>
                  )}
                </button>

                <span className="forgotPassword">
                  <a> Quên mật khẩu? <br/>Liên hệ MKT hoặc TSM để được hỗ trợ </a>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
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
    </div>
  );
};

export default Login;
