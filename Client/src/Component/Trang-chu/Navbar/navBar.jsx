import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // React Router for navigation
import NavigationPopup from "../../Popup/NavigationPopup";
import "./navBar.css";

// Import assets
import logoCoke from "../../../assets/AboutUs/Logo_Coke.png";

function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Manage menu state
  const [activeItem, setActiveItem] = useState("/"); // Highlight active route
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate(); // Navigation function from React Router

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // Xóa token khỏi localStorage
    navigate("/"); // Điều hướng về trang đăng nhập
  };

  const handleLogoClick = (e) => {
    e.preventDefault(); // Ngăn chặn hành vi mặc định
    setShowPopup(true);
  };

  // Menu items array
  const menuItems = [
    { label: "Danh sách chương trình", path: "/event" },
    { label: "Danh sách khách hàng", path: "/danh-sach-khach-hang" },
    { label: "Danh sách sản phẩm", path: "/scanned-items" },
    { label: "Đổi mật khẩu", path: "/doi-mat-khau" },
    { label: "Đăng xuất", onClick: handleLogout }, // Logout button
  ];

  // Update active menu item on route change
  useEffect(() => {
    setActiveItem(window.location.pathname); // Get current path
  }, [window.location.pathname]); // Trigger re-render when path changes

  return (
    <>
      <Navbar
        className="shadow-lg bg-red-600"
        isBordered
        onMenuOpenChange={setIsMenuOpen} // Update menu state on toggle
      >
        {/* Logo Section */}
        <NavbarContent justify="center">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="flex md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)} // Toggle menu
          />
          <NavbarBrand>
            <a href="#" onClick={handleLogoClick}>
              <img src={logoCoke} className="h-full w-1/2" alt="Logo Coke" />
            </a>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop Navigation */}
        <NavbarContent className="hidden sm:flex gap-4" justify="start">
          {menuItems.map((item, index) => (
            <NavbarItem key={index}>
              {item.onClick ? (
                // Logout button
                <button
                  id="logout"
                  className="pt-[1.5rem] text-white inline-block justify-between px-1 text-sm flex-1 hover:rounded-sm hover:text-gray-200"
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              ) : (
                // Links to other routes
                <Link
                  id="NavbarItem"
                  className={`pt-[1.5rem] text-white inline-block justify-between px-1 text-sm flex-1 hover:rounded-sm hover:text-gray-200 ${
                    activeItem === item.path ? "text-gray-200 active" : ""
                  }`}
                  href={item.path}
                  onClick={() => setActiveItem(item.path)} // Highlight active
                >
                  {item.label}
                </Link>
              )}
            </NavbarItem>
          ))}       
        </NavbarContent>

        {/* Mobile Menu */}
        <NavbarMenu isOpen={isMenuOpen} className="bg-red-600 max-h-fit">
          {menuItems.map((item, index) => (
            <NavbarMenuItem key={index}>
              {item.onClick ? (
                // Logout button for mobile
                <button
                  className="w-full text-white hover:text-gray-200 hover:text-lg"
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              ) : (
                // Links for mobile
                <Link
                  className="w-full text-white hover:text-gray-200 hover:text-lg"
                  href={item.path}
                  size="lg"
                >
                  {item.label}
                </Link>
              )}
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>

      {/* Navigation Popup */}
      <NavigationPopup 
        isOpen={showPopup} 
        onClose={() => setShowPopup(false)}
      />
    </>
  );
}

export default NavBar;
