import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./customer.scss";

const Customer = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [customers] = useState([
    {
      id: 1,
      name: "Maruti Textile",
      contactPerson: "Rajesh Sharma",
      avatar: "👨‍💼",
      avatarBg: "#3b82f6",
      balance: 4000,
    },
    {
      id: 2,
      name: "Kamal Textile",
      contactPerson: "Virat Shrivas",
      avatar: "👨‍💼",
      avatarBg: "#0ea5e9",
      balance: 4000,
    },
    {
      id: 3,
      name: "Ram Textile",
      contactPerson: "Hari Varma",
      avatar: "👨‍💼",
      avatarBg: "#10b981",
      balance: 4000,
    },
    {
      id: 4,
      name: "Shivshakti Textile",
      contactPerson: "Om Prakash",
      avatar: "👨‍💼",
      avatarBg: "#f59e0b",
      balance: 4000,
    },
    {
      id: 5,
      name: "Om Textile",
      contactPerson: "Darshak Shah",
      avatar: "👨‍💼",
      avatarBg: "#ef4444",
      balance: 4000,
    },
    {
      id: 6,
      name: "Joan Textile",
      contactPerson: "Hardik Parmar",
      avatar: "👨‍💼",
      avatarBg: "#8b5cf6",
      balance: 4000,
    },
    {
      id: 7,
      name: "Hermika Textile",
      contactPerson: "Harmika Varma",
      avatar: "👨‍💼",
      avatarBg: "#ec4899",
      balance: 4000,
    },
    {
      id: 8,
      name: "Hariom Textile",
      contactPerson: "Hari Sharma",
      avatar: "👨‍💼",
      avatarBg: "#14b8a6",
      balance: 4000,
    },
  ]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddCustomer = () => {
    navigate("/vendor/add-customer");
  };

  const handleCustomerClick = (customerId) => {
    navigate(`/vendor/customer-details/${customerId}`);
  };

  return (
    <div className="customer-page">
      <div className="page-header">
        <h1 className="page-title">Customer</h1>
        <button className="add-btn" onClick={handleAddCustomer}>
          +
        </button>
      </div>

      <div className="page-content">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search Customer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="customers-list">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="customer-item"
                onClick={() => handleCustomerClick(customer.id)}
              >
                <div className="customer-info">
                  <div
                    className="customer-avatar"
                    style={{ background: customer.avatarBg }}
                  >
                    <span>{customer.avatar}</span>
                  </div>
                  <div className="customer-details">
                    <h3 className="customer-name">{customer.name}</h3>
                    <p className="contact-person">{customer.contactPerson}</p>
                  </div>
                </div>
                <div className="customer-balance">
                  ₹{customer.balance.toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No customers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customer;
