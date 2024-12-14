import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";

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
    console.log("Submitting login with:", { username, password });

    try {
      const response = await fetch("http://localhost:3002/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Login failed:", data);
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();
      console.log("Login successful:", data);

      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loginPage flex">
      <div className="container bg-red-600 flex">
        <div className="videoDiv">
          <video src={video} autoPlay muted loop></video>
          <div className="textDiv">
          </div>
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

              <button type="submit" className="btn bg-red-900 flex" disabled={isLoading}>
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
                <a> Quên mật khẩu? Liên hệ RTMM để được hỗ trợ </a>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
