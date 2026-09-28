import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext(null);

axios.defaults.withCredentials = true;

// Dynamically points to Render in production
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://zuno-h2dg.onrender.com';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshAccessToken = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/refresh`);
            setToken(res.data.accessToken);
            return res.data.accessToken;
        } catch (err) {
            setToken(null);
            setUser(null);
            return null;
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const activeToken = await refreshAccessToken();
                if (activeToken) {
                    const res = await axios.get(`${API_URL}/api/auth/me`, {
                        headers: { Authorization: `Bearer ${activeToken}` }
                    });
                    setUser(res.data.user);
                }
            } catch (err) {
                console.error("Authentication init failed.");
            } finally {
                setLoading(false);
            }
        };
        initializeAuth();
    }, []);

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                const requestPath = originalRequest.url ? originalRequest.url.toLowerCase() : "";

                if (
                    requestPath.includes("/auth/login") || 
                    requestPath.includes("/auth/signup") || 
                    requestPath.includes("/auth/refresh")
                ) {
                    return Promise.reject(error);
                }

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const newToken = await refreshAccessToken();
                    if (newToken) {
                        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                        return axios(originalRequest);
                    }
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        setToken(res.data.accessToken);
        setUser(res.data.user);
        return res.data;
    };

    const signup = async (username, email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/signup`, { username, email, password });
        return res.data;
    };

    const logout = async () => {
        await axios.post(`${API_URL}/api/auth/logout`);
        setToken(null);
        setUser(null);
    };

    const getAuthHeaders = () => {
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout, getAuthHeaders }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}