import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import "../Styles/auth.css";

export default function Signup() {
    const navigate = useNavigate();
    const { signup, login } = useAuth();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
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

    if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    setLoading(true);
    try {
        const data = await signup(form.username, form.email, form.password);
        // Inside Signup.jsx -> handleSubmit
            if (data.success) {
                alert("Account created successfully!");

                const baseUrl = (import.meta.env.VITE_DASHBOARD_URL || "https://zuno-dd7j.vercel.app").replace(/\/$/, "");
                try {
                    const loginData = await login(form.email, form.password);
                    const token = loginData?.accessToken;
                    const redirectUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
                    window.location.href = redirectUrl;
                } catch (loginErr) {
                    window.location.href = baseUrl;
                }
            }
            } catch (err) {
        setError(err.response?.data?.message || "Signup failed. Try again.");
    } finally {
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
                    <h2>Create Account</h2>

                    {error && <div className="alert alert-danger py-2 fs-7">{error}</div>}

                    <div className="input-group">
                        <FaUser />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={form.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

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

                    <div className="input-group">
                        <FaLock />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>

                    <p className="bottom-text">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}