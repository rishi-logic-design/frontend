import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./newBill.scss";

const NewBill = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Mona Silk Touch",
      category: "Mona",
      qty: 10,
      unit: "mtr",
      price: 5000,
    },
    {
      id: 2,
      name: "Premium Banglory Shine",
      category: "Banglory",
      qty: 12,
      unit: "mtr",
      price: 5000,
    },
  ]);
  const [challans, setChallans] = useState([
    {
      id: 1,
      challanNo: "1001",
      date: "09 August 2025",
      totalAmount: 20000,
      selected: false,
    },
    {
      id: 2,
      challanNo: "1010",
      date: "30 September 2025",
      totalAmount: 10000,
      selected: true,
    },
  ]);
  const [discount, setDiscount] = useState(10);
  const [gst, setGst] = useState(18);

  const handleToggleChallan = (id) => {
    setChallans(
      challans.map((challan) =>
        challan.id === id
          ? { ...challan, selected: !challan.selected }
          : challan,
      ),
    );
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const calculateDiscount = () => {
    return (calculateSubtotal() * discount) / 100;
  };

  const calculateGST = () => {
    return ((calculateSubtotal() - calculateDiscount()) * gst) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateGST();
  };

  const handleGenerateBill = () => {
    const billData = {
      customer,
      invoiceDate,
      items,
      selectedChallans: challans.filter((c) => c.selected),
      discount,
      gst,
      total: calculateTotal(),
    };
    console.log("Bill Data:", billData);
    // Add your bill generation logic here
  };

  return (
    <div className="new-bill-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Create Bill</h1>
      </div>

      <div className="page-content">
        <div className="bill-form">
          {/* Customer & Date Section */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="customer">Customer</label>
              <select
                id="customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="form-input"
              >
                <option value="">Select Customer</option>
                <option value="customer1">Customer 1</option>
                <option value="customer2">Customer 2</option>
                <option value="customer3">Customer 3</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="invoiceDate">Invoice Date</label>
              <input
                type="date"
                id="invoiceDate"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="items-section">
            <h2 className="section-title">Items</h2>
            <div className="items-list">
              {items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-info">
                    <div className="item-header">
                      <h3 className="item-name">{item.name}</h3>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="item-category">{item.category}</p>
                    <div className="item-details">
                      <div className="detail">
                        <span className="detail-label">Qty</span>
                        <span className="detail-value">
                          {item.qty} {item.unit}
                        </span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Price</span>
                        <span className="detail-value">
                          ₹{item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="add-challan-btn">+ Add Challan</button>
          </div>

          {/* Challans Section */}
          <div className="challans-section">
            {challans.map((challan) => (
              <label key={challan.id} className="challan-card">
                <input
                  type="checkbox"
                  checked={challan.selected}
                  onChange={() => handleToggleChallan(challan.id)}
                  className="challan-checkbox"
                />
                <div className="challan-info">
                  <div className="challan-row">
                    <span className="challan-label">Challan No:</span>
                    <span className="challan-value">{challan.challanNo}</span>
                  </div>
                  <div className="challan-row">
                    <span className="challan-label">Date:</span>
                    <span className="challan-value">{challan.date}</span>
                  </div>
                  <div className="challan-row">
                    <span className="challan-label">Total Amount:</span>
                    <span className="challan-value">
                      ₹{challan.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <h2 className="section-title">Summary</h2>
            <div className="summary-content">
              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">
                  ₹{calculateSubtotal().toLocaleString()}
                </span>
              </div>
              <div className="summary-row input-row">
                <div className="input-with-label">
                  <span className="summary-label">Discount</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="inline-input"
                    min="0"
                    max="100"
                  />
                  <span className="unit">%</span>
                </div>
                <div className="input-with-label">
                  <span className="summary-label">GST</span>
                  <input
                    type="number"
                    value={gst}
                    onChange={(e) => setGst(Number(e.target.value))}
                    className="inline-input"
                    min="0"
                    max="100"
                  />
                  <span className="unit">%</span>
                </div>
              </div>
              <div className="summary-row">
                <span className="summary-label">Calculated Tax</span>
                <span className="summary-value">
                  ₹{calculateGST().toLocaleString()}
                </span>
              </div>
              <div className="total-row">
                <span className="total-label">Total Amount Due</span>
                <span className="total-value">
                  ₹{calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="cancel-btn" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button className="generate-btn" onClick={handleGenerateBill}>
              Generate Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBill;
