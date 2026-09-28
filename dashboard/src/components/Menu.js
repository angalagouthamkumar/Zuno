import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useGeneralContext } from "./GeneralContext";
import axios from "axios";

// Dynamically points to Render in production
const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://zuno-trading-backend.onrender.com';
const LANDING_PAGE_URL = process.env.REACT_APP_LANDING_URL || 'https://zuno-ee9u.vercel.app';

const Menu = () => {
  const contextValues = useGeneralContext() || {};
  const { user = null, darkMode = false, toggleDarkMode = () => {} } = contextValues;

  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // Create a reference tag to detect external clicks
  const dropdownRef = useRef(null);

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen((prev) => !prev);
  };

  // Close dropdown if clicked anywhere outside of the profile wrapper
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("accessToken");
      delete axios.defaults.headers.common["Authorization"];
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      window.location.href = `${LANDING_PAGE_URL}/login`;
    } catch (err) {
      console.error("Logout request failed:", err);
      sessionStorage.removeItem("accessToken");
      delete axios.defaults.headers.common["Authorization"];
      window.location.href = `${LANDING_PAGE_URL}/login`;
    }
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  const currentUsername = user?.username || "Loading...";
  const avatarInitials = currentUsername.substring(0, 2).toUpperCase();

  return (
    <div className="menu-container" style={{ position: "relative" }}>
      <div className="menus">
        <ul>
          <li>
            <Link style={{ textDecoration: "none" }} to="/" onClick={() => handleMenuClick(0)}>
              <p className={selectedMenu === 0 ? activeMenuClass : menuClass}>Dashboard</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/orders" onClick={() => handleMenuClick(1)}>
              <p className={selectedMenu === 1 ? activeMenuClass : menuClass}>Orders</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/holdings" onClick={() => handleMenuClick(2)}>
              <p className={selectedMenu === 2 ? activeMenuClass : menuClass}>Holdings</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/positions" onClick={() => handleMenuClick(3)}>
              <p className={selectedMenu === 3 ? activeMenuClass : menuClass}>Positions</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="funds" onClick={() => handleMenuClick(4)}>
              <p className={selectedMenu === 4 ? activeMenuClass : menuClass}>Funds</p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/apps" onClick={() => handleMenuClick(6)}>
              <p className={selectedMenu === 6 ? activeMenuClass : menuClass}>Apps</p>
            </Link>
          </li>
        </ul>
        <hr />
        
        {/* Added ref={dropdownRef} to anchor tracking accurately */}
        <div className="profile-wrapper" ref={dropdownRef}>
          <div className="profile" onClick={handleProfileClick} style={{ userSelect: "none" }}>
            <div className="avatar">{avatarInitials}</div>
            <p className="username">{currentUsername}</p>
          </div>

          {isProfileDropdownOpen && (
            <div className="custom-profile-dropdown" onClick={(e) => e.stopPropagation()}>
              <div 
                className="dropdown-row" 
                onClick={toggleDarkMode}
                style={{
                  padding: "10px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--dropdown-border)",
                  cursor: "pointer",
                  userSelect: "none"
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "var(--dropdown-text)", fontWeight: "500" }}>
                  Dark Mode
                </span>
                <input 
                  type="checkbox" 
                  checked={!!darkMode}
                  onChange={() => {}} 
                  style={{ cursor: "pointer" }}
                />
              </div>
              
              <button 
                onClick={handleLogout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  color: "#df514c",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;