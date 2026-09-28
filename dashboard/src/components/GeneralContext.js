import React, { useState, useEffect, createContext, useContext } from "react";
import BuyActionWindow from "./BuyActionWindow";
import axios from "axios";

axios.defaults.withCredentials = true;

// Create the raw context tracking engine instance
const GeneralContext = createContext(null);

// Production Render backend and Vercel landing page configuration
const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://zuno-h2dg.onrender.com';
const LANDING_PAGE_URL = process.env.REACT_APP_LANDING_URL || 'https://zuno-ee9u.vercel.app';

// Synchronously extract and bind token on script evaluation/initialization
const extractSyncToken = () => {
  if (typeof window === "undefined") return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      sessionStorage.setItem("accessToken", urlToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${urlToken}`;
      // Clean query parameter from URL without losing route path
      const cleanUrl = window.location.pathname + (window.location.hash || "");
      window.history.replaceState({}, document.title, cleanUrl);
      console.log("[AuthTrace] Synchronously captured token from URL query:", `${urlToken.substring(0, 15)}...`);
      return urlToken;
    }
    const storedToken = sessionStorage.getItem("accessToken");
    if (storedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      console.log("[AuthTrace] Synchronously bound persisted token from sessionStorage");
      return storedToken;
    }
  } catch (err) {
    console.error("[AuthTrace] Synchronous token extraction error:", err);
  }
  return null;
};

// Immediately execute synchronously on module load
extractSyncToken();

export const GeneralContextProvider = (props) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Handle Fetching Real Profile Data
  useEffect(() => {
    let isMounted = true;

    const initializeDashboardAuth = async () => {
      try {
        // Ensure token is captured synchronously or from storage
        let token = sessionStorage.getItem("accessToken") || extractSyncToken();

        console.log("[AuthTrace] Token status in sessionStorage:", token ? "PRESENT" : "MISSING");
        console.log("[AuthTrace] Targeting backend URL:", API_URL);

        // 1. Direct Bearer token validation
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          try {
            console.log("[AuthTrace] Sending request to:", `${API_URL}/api/auth/me`);
            const profileRes = await axios.get(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            console.log("[AuthTrace] /api/auth/me response received:", profileRes.status, profileRes.data);

            if (profileRes.data && profileRes.data.success && isMounted) {
              setUser(profileRes.data.user);
              setAuthLoading(false);
              return;
            }
          } catch (profileErr) {
            console.warn(
              "[AuthTrace] Direct token validation failed at /api/auth/me:",
              profileErr.response?.status,
              profileErr.response?.data || profileErr.message
            );
            // If explicit 401 or 403, token is stale/invalid
            if (profileErr.response?.status === 401 || profileErr.response?.status === 403) {
              sessionStorage.removeItem("accessToken");
              delete axios.defaults.headers.common["Authorization"];
            }
          }
        }

        // 2. Fallback: Cookie-based refresh session
        console.log("[AuthTrace] Attempting cookie-based fallback at /api/auth/refresh...");
        try {
          const refreshRes = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
          if (refreshRes.data && refreshRes.data.accessToken) {
            const newToken = refreshRes.data.accessToken;
            sessionStorage.setItem("accessToken", newToken);
            axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

            const profileRes = await axios.get(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });

            if (profileRes.data && profileRes.data.success && isMounted) {
              setUser(profileRes.data.user);
              setAuthLoading(false);
              return;
            }
          }
        } catch (refreshErr) {
          console.warn("[AuthTrace] Cookie refresh fallback failed:", refreshErr.response?.status, refreshErr.response?.data || refreshErr.message);
        }

        // If all authentication attempts fail, redirect to landing login
        console.warn("[AuthTrace] All authentication methods failed. Evicting session and redirecting to login.");
        sessionStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];

        if (isMounted) {
          setAuthLoading(false);
          window.location.href = `${LANDING_PAGE_URL}/login`;
        }
      } catch (err) {
        console.error("[AuthTrace] Session initialization unhandled exception:", err.response?.data || err.message);
        sessionStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];

        if (isMounted) {
          setAuthLoading(false);
          window.location.href = `${LANDING_PAGE_URL}/login`;
        }
      }
    };

    initializeDashboardAuth();

    return () => {
      isMounted = false;
    };
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
    setDarkMode((prev) => !prev);
  };

  // Auth gating: render smooth loading overlay while session is being verified to prevent UI flash or child race conditions
  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: darkMode ? "#181818" : "#fbfbfb",
          color: darkMode ? "#e0e0e0" : "#333",
          fontFamily: "'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            border: `4px solid ${darkMode ? "#333" : "#e0e0e0"}`,
            borderTop: "4px solid #387ed1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: "18px", fontSize: "14px", fontWeight: "500", opacity: 0.85 }}>
          Authenticating secure session...
        </p>
      </div>
    );
  }

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
        user,
        loading: authLoading,
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