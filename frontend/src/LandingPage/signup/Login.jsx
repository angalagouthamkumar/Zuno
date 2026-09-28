import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import "../Styles/auth.css";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        const data = await login(form.email, form.password);
        
        // Inside Login.jsx -> handleSubmit
        if (data && (data.success || data.accessToken)) {
            setLoading(false);
            const token = data.accessToken;
            const baseUrl = (import.meta.env.VITE_DASHBOARD_URL || "https://zuno-dd7j.vercel.app").replace(/\/$/, "");
            const redirectUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
            window.location.href = redirectUrl;
        } else {
            setError("Server validation completed with an irregular payload.");
            setLoading(false);
        }
    } catch (err) {
        setError(err.response?.data?.message || "Invalid Gmail or password.");
        setLoading(false);
    }
};

    return (
        <div className="auth-container">
            <div className="auth-left">
                <h1>ZUNO</h1>
                <p>Smart Investing Starts Here</p>
            </div>

            <div className="auth-right">
                <form className="auth-card" onSubmit={handleSubmit}>
                    <h2>Welcome Back</h2>

                    {error && <div className="alert alert-danger py-2 fs-7">{error}</div>}

                    <div className="input-group">
                        <FaEnvelope />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <FaLock />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Verifying..." : "Login"}
                    </button>

                    <p className="bottom-text">
                        Don't have an account? <Link to="/signup">Signup</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}