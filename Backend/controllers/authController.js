const User = require("../model/userModel");
const jwt = require("jsonwebtoken");

const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "All input fields are mandatory." });
        }

        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email schema provided." });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password length must be at least 6 characters." });
        }

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(409).json({ success: false, message: "User credentials already active in system." });
        }

        const user = new User({ username, email, password });
        await user.save();

        return res.status(201).json({ success: true, message: "Account created successfully." });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password inputs are required." });
        }

        const user = await User.findOne({ email });
        
        if (!user || !user.password) {
            return res.status(401).json({ success: false, message: "Invalid system credentials." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid system credentials." });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        // Cross-origin authentication cookie between Vercel subdomains and Render
        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(200).json({
            success: true,
            accessToken,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.refreshSession = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(401).json({ success: false, message: "Session expired or cookie context dropped." });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user || user.refreshToken !== token) {
            return res.status(403).json({ success: false, message: "Token reuse detected or signature corrupted." });
        }

        const newAccessToken = generateAccessToken(user._id);
        return res.status(200).json({ success: true, accessToken: newAccessToken });
    } catch (err) {
        return res.status(403).json({ success: false, message: "Session validation failed." });
    }
};

exports.logoutUser = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (token) {
            await User.findOneAndUpdate({ refreshToken: token }, { $unset: { refreshToken: 1 } });
        }
        // FIX: Clear matched cookie options securely
        res.clearCookie("refreshToken", { 
            httpOnly: true, 
            secure: true,
            sameSite: "none" 
        });
        return res.status(200).json({ success: true, message: "Session cleared successfully." });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -refreshToken");
        if (!user) {
            return res.status(404).json({ success: false, message: "User context not identified." });
        }
        return res.status(200).json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};