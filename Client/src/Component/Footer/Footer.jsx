import React from 'react'

import logoTen from "../../assets/Footer/logo-ten.jpg"
import logo1 from "../../assets/Footer/logo1.png"
import logoText from "../../assets/Footer/logotext.png";

function Footer() {
  return (
    <footer className="bg-white top-0 text-center flex justify-between items-center">
      <div className="bg-white flex items-center">
        <a
          rel="noopener noreferrer"
          className="text-[#007bff] bg-transparent"
          href="https://tengroup.com.vn/"
          target="_blank"
        >
          <img src={logoTen} alt="logo" className="h-[20px]" />
        </a>
      </div>
      <div className="items-center justify-between flex">
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
  );
}

export default Footer