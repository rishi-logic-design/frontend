import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./customer.scss";
import customerService from "../services/customerService";

const Customer = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData"));
  const vendorId = vendorData?.id;

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const res = await customerService.getCustomers({ vendorId });
      console.log(res);
      setCustomers(res?.data?.rows || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);

    if (!vendorId) return;
    try {
      if (!value.trim()) {
        fetchCustomers();
        return;
      }

      setLoading(true);
      const data = await customerService.searchCustomers(value, vendorId);
      setCustomers(data || []);
    } catch (error) {
      console.error("Error searching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [vendorId]);

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
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="customers-list">
          {loading ? (
            <p className="page-center">Loading...</p>
          ) : customers.length > 0 ? (
            customers.map((customers) => (
              <div
                key={customers.id || customers._id}
                className="customer-item"
                onClick={() =>
                  handleCustomerClick(customers.id || customers._id)
                }
              >
                <div className="customer-info">
                  <div className="customer-avatar">
                    {customers.customerImage ? (
                      <img
                        src={customers.customerImage}
                        alt="Customer"
                        className="customer-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "";
                        }}
                      />
                    ) : (
                      customers.customerName?.charAt(0)?.toUpperCase() || "👤"
                    )}
                  </div>{" "}
                  <div className="customer-details">
                    <h3 className="customer-name">{customers.customerName}</h3>
                    <p
                      className="contact-person"
                      style={{
                        marginBottom: "4px",
                        fontWeight: "400",
                        color: "darkblue",
                      }}
                    >
                      {customers.businessName || "-"}
                    </p>
                    <p className="contact-person">
                      {customers.mobileNumber || "-"}
                    </p>
                  </div>
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
