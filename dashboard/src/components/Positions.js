import React, { useState, useEffect } from "react";
import axios from "axios";

// Dynamically points to Render in production
const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://zuno-trading-backend.onrender.com';

const Positions = () => {
  const [positionsData, setPositionsData] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    axios
      .get(`${API_URL}/allpositions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      })
      .then((response) => {
        setPositionsData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching positions:", error);
      });
  }, []);

  return (
    <>
      <h3 className="title">Positions ({positionsData.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg.</th>
              <th>LTP</th>
              <th>P&L</th>
              <th>Chg.</th>
            </tr>
          </thead>

          <tbody>
            {positionsData.map((stock, index) => {
              const pnl = (stock.price - stock.avg) * stock.qty;

              const pnlClass = pnl >= 0 ? "profit" : "loss";
              const changeClass =
                (stock.day && stock.day.includes("-")) ? "loss" : "profit";

              return (
                <tr key={index}>
                  <td>{stock.product}</td>
                  <td className={pnlClass}>{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{stock.avg.toFixed(2)}</td>
                  <td>{stock.price.toFixed(2)}</td>
                  <td className={pnlClass}>
                    {pnl.toFixed(2)}
                  </td>
                  <td className={changeClass}>{stock.day}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Positions;