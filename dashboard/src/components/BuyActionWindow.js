import React, { useState, useContext } from "react"; 
import { Link } from "react-router-dom";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";

// Dynamically points to Render in production
const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://zuno-trading-backend.onrender.com';

const BuyActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);

  const { closeBuyWindow } = useContext(GeneralContext);

  const handleBuyClick = (e) => {
    e.preventDefault(); 

    console.log("Buy button clicked. Sending data...");

    const token = sessionStorage.getItem("accessToken");
    axios
      .post(`${API_URL}/newOrder`, {
        name: uid,
        qty: Number(stockQuantity), 
        price: Number(stockPrice),   
        mode: "BUY",
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      })
      .then((response) => {
        console.log("Order placed successfully:", response.data);
        closeBuyWindow();
      })
      .catch((error) => {
        console.error("Error placing order:", error);
        alert("Failed to connect to backend server.");
      });
  };

  const handleCancelClick = (e) => {
    e.preventDefault();
    closeBuyWindow();
  };

  return (
    <div className="container" id="buy-window" draggable="true">
      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="qty"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
            />
          </fieldset>
        </div>
      </div>
      <div className="buttons">
        <span>Margin required ₹140.65</span>
        <div>
          <button type="button" className="btn btn-blue" onClick={handleBuyClick} style={{ border: 'none', cursor: 'pointer' }}>
            Buy
          </button>
          <Link to="#" className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;