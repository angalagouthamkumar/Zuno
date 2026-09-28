import React, { useState, useEffect, createContext, useContext } from "react";
import BuyActionWindow from "./BuyActionWindow";
import axios from "axios";

axios.defaults.withCredentials = true;

// Create the raw context tracking engine instance
const GeneralContext = createContext(null);

// Production Render backend and Vercel landing page configuration
const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://zuno-trading-backend.onrender.com';
const LANDING_PAGE_URL = process.env.REACT_APP_LANDING_URL || 'https://zuno-ee9u.vercel.app';

export const GeneralContextProvider = (props) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Handle Fetching Real Profile Data
  useEffect(() => {
    const initializeDashboardAuth = async () => {
      try {
        // 1. Check for token in URL parameters (cross-domain handoff from frontend)
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get("token");

        if (token) {
          // Clean the token from the URL address bar immediately
          window.history.replaceState({}, document.title, window.location.pathname || "/");
          // Persist token in sessionStorage for reload persistence
          sessionStorage.setItem("accessToken", token);
        } else {
          // Retrieve persisted token on page reloads
          token = sessionStorage.getItem("accessToken");
        }

        // 2. If token is available, authenticate directly with Bearer header
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          try {
            const profileRes = await axios.get(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (profileRes.data && profileRes.data.success) {
              setUser(profileRes.data.user);
              return;
            }
          } catch (profileErr) {
            console.warn("Direct token validation failed, falling back to cookie refresh:", profileErr.message);
            sessionStorage.removeItem("accessToken");
            delete axios.defaults.headers.common["Authorization"];
          }
        }

        // 3. Fallback: Cookie-based refresh session
        const refreshRes = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        if (refreshRes.data && refreshRes.data.accessToken) {
          const newToken = refreshRes.data.accessToken;
          sessionStorage.setItem("accessToken", newToken);
          axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

          const profileRes = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
          if (profileRes.data && profileRes.data.success) {
            setUser(profileRes.data.user);
            return;
          }
        }

        // If all authentication attempts fail, redirect to login
        sessionStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];
        window.location.href = `${LANDING_PAGE_URL}/login`;
      } catch (err) {
        console.error("Session initialization completely failed:", err.response?.data || err.message);
        sessionStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];
        window.location.href = `${LANDING_PAGE_URL}/login`;
      }
    };
    initializeDashboardAuth();
  }, []);

  // Handle Applying Dark Mode CSS Classes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleOpenBuyWindow = (uid) => {
    setIsBuyWindowOpen(true);
    setSelectedStockUID(uid);
  };

  const handleCloseBuyWindow = () => {
    setIsBuyWindowOpen(false);
    setSelectedStockUID("");
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev); // Safe functional state update tracking
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
        user,
        darkMode,
        toggleDarkMode,
      }}
    >
      {props.children}
      {isBuyWindowOpen && <BuyActionWindow uid={selectedStockUID} />}
    </GeneralContext.Provider>
  );
};

// Export the secure hook wrapper to feed reactive state changes down seamlessly
export function useGeneralContext() {
  return useContext(GeneralContext);
}

export default GeneralContext;