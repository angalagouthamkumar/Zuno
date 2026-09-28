import React, { useState, useEffect } from "react";
import axios from "axios";
import { VerticalGraph } from "./VerticleGraph";

// Dynamically points to Render in production
const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://zuno-h2dg.onrender.com';

const Holdings = () => {
  const [holdingsData, setHoldingsData] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    axios
      .get(`${API_URL}/allholdings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      })
      .then((response) => {
        setHoldingsData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching holdings:", error);
      });
  }, []);

  const labels = holdingsData.map((holding) => holding.name);
  const data = {
    labels,
    datasets: [
      {
        label: 'Stock Name',
        data: holdingsData.map((stock) => stock.price),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Dataset 2',
        data: labels.map(() => Math.floor(Math.random() * 1000)),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <>
      <h3 className="title">Holdings ({holdingsData.length})</h3>

      <div className="order-table">
        <VerticalGraph data={data} />
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg. cost</th>
              <th>LTP</th>
              <th>Cur. val</th>
              <th>P&L</th>
              <th>Net chg.</th>
              <th>Day chg.</th>
            </tr>
          </thead>

          <tbody>
            {holdingsData.map((stock, index) => {
              const currValue = stock.price * stock.qty;
              const investment = stock.avg * stock.qty;
              const profitLoss = currValue - investment;

              const profClass = profitLoss >= 0 ? "profit" : "loss";
              const dayClass = (stock.day && stock.day.includes("-")) ? "loss" : "profit";

              return (
                <tr key={index}>
                  <td className={profClass}>{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{stock.avg.toFixed(2)}</td>
                  <td>{stock.price.toFixed(2)}</td>
                  <td>{currValue.toFixed(2)}</td>
                  <td className={profClass}>
                    {profitLoss.toFixed(2)}
                  </td>
                  <td className={profClass}>{stock.net}</td>
                  <td className={dayClass}>{stock.day}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="row">
        <div className="col">
          <h5>
            29,875.<span>55</span>
          </h5>
          <p>Total investment</p>
        </div>

        <div className="col">
          <h5>
            31,428.<span>95</span>
          </h5>
          <p>Current value</p>
        </div>

        <div className="col">
          <h5>1,553.40 (+5.20%)</h5>
          <p>P&amp;L</p>
        </div>
      </div>
    </>
  );
};

export default Holdings;