const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const axios = require("axios");

const { HoldingsModel } = require("./model/holdingsModel");
const { PositionModel } = require("./model/positionModel");
const { OrderModel } = require("./model/ordersModel");
const authRoutes = require("./Routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const marketController = require("./controllers/marketController");

const PORT = process.env.PORT || 3002;
const url = process.env.MONGO_URL;

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "https://zuno-ee9u.vercel.app",
  "https://zuno-dd7j.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Normalize both origin and strings to prevent subtle trailing slash or white space errors
    const cleanedOrigin = origin.trim().replace(/\/$/, "");
    const matched = allowedOrigins.some(o => o && o.trim().replace(/\/$/, "") === cleanedOrigin);

    if (!matched) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/api/auth", authRoutes);

app.get("/allholdings", authMiddleware, async (req, res) => {
    try {
        const holdings = await HoldingsModel.find({});

        const updatedHoldings = await Promise.all(
            holdings.map(async (holding) => {
                try {
                    const response = await axios.get(
                        `https://finnhub.io/api/v1/quote?symbol=${holding.name}&token=${process.env.FINNHUB_API_KEY}`
                    );

                    const quote = response.data;
                    const price = quote?.c ?? holding.price ?? holding.avg;
                    const change = quote?.d ?? 0;
                    const changePercent = quote?.dp ?? 0;
                    const dayStr = quote?.dp != null ? `${quote.dp.toFixed(2)}%` : (holding.day || "0.00%");
                    const netStr = holding.avg ? `${(((price - holding.avg) / holding.avg) * 100).toFixed(2)}%` : (holding.net || "0.00%");

                    return {
                        ...holding.toObject(),
                        price: price,
                        change: change,
                        changePercent: changePercent,
                        currentValue: price * holding.qty,
                        pnl: (price - holding.avg) * holding.qty,
                        day: dayStr,
                        net: netStr,
                        isLoss: price < holding.avg
                    };
                } catch (error) {
                    return holding;
                }
            })
        );

        res.json(updatedHoldings);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get("/allpositions", authMiddleware, async (req, res) => {
    try {
        const allpositions = await PositionModel.find({});
        res.json(allpositions);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/quote/:symbol", marketController.getQuote);

app.post("/newOrder", authMiddleware, async (req, res) => {
    try {
        const newOrder = new OrderModel({
            name: req.body.name,
            qty: req.body.qty,
            price: req.body.price,
            mode: req.body.mode
        });

        await newOrder.save();
        res.status(201).json({
            success: true,
            message: "Order saved successfully",
            order: newOrder
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

mongoose.connect(url)
.then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((err) => {
    console.log(err);
});