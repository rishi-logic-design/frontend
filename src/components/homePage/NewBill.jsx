import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdAdd } from "react-icons/md";
import billService from "../../services/billService";
import challanService from "../../services/challanService";
import customerService from "../../services/customerService";
import "./newBill.scss";

const NewBill = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [availableChallans, setAvailableChallans] = useState([]);

  const [formData, setFormData] = useState({
    customer: "",
    invoiceDate: new Date().toISOString().split("T")[0],
  });

  const [selectedChallans, setSelectedChallans] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(18);

  const getVendorId = () => {
    const vendorData = localStorage.getItem("vendorData");
    if (vendorData) {
      try {
        const parsed = JSON.parse(vendorData);
        return parsed.vendorId || parsed._id || parsed.id;
      } catch (e) {
        console.error("Error parsing vendor data:", e);
      }
    }

    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return parsed.vendorId || parsed._id || parsed.id;
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    return null;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const vendorId = getVendorId();

      if (!vendorId) {
        alert("Vendor ID not found. Please login again.");
        navigate("/login");
        return;
      }

      const customersData = await customerService.getCustomers(vendorId);
      console.log("Customers Data:", customersData);

      let customersList = [];
      if (customersData?.data?.rows && Array.isArray(customersData.data.rows)) {
        customersList = customersData.data.rows;
      } else if (customersData?.rows && Array.isArray(customersData.rows)) {
        customersList = customersData.rows;
      } else if (Array.isArray(customersData)) {
        customersList = customersData;
      }

      setCustomers(customersList);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = async (customerId) => {
    setFormData((prev) => ({ ...prev, customer: customerId }));
    setSelectedChallans([]);
    setAvailableChallans([]);

    if (!customerId) return;

    try {
      setLoading(true);

      const challansData = await challanService.getChallans();
      console.log("All Challans Data:", challansData);

      let allChallans = [];
      if (challansData?.data && Array.isArray(challansData.data)) {
        allChallans = challansData.data;
      } else if (challansData?.rows && Array.isArray(challansData.rows)) {
        allChallans = challansData.rows;
      } else if (Array.isArray(challansData)) {
        allChallans = challansData;
      }

      console.log("Processed Challans:", allChallans);
      console.log("Selected Customer ID:", customerId);

      const customerChallans = allChallans.filter((challan) => {
        const challanCustomerId =
          challan.customerId || challan.customer?._id || challan.customer?.id;

        return String(challanCustomerId) === String(customerId);
      });

      console.log("Filtered Customer Challans:", customerChallans);
      setAvailableChallans(customerChallans);
    } catch (error) {
      console.error("Error fetching challans:", error);
      alert("Failed to load challans for this customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChallan = (challanId) => {
    setSelectedChallans((prev) => {
      if (prev.includes(challanId)) {
        return prev.filter((id) => id !== challanId);
      } else {
        return [...prev, challanId];
      }
    });
  };

  const getAllItems = () => {
    const items = [];
    availableChallans.forEach((challan) => {
      if (selectedChallans.includes(challan._id || challan.id)) {
        if (Array.isArray(challan.items)) {
          challan.items.forEach((item) => {
            items.push({
              ...item,
              challanId: challan._id || challan.id,
              challanNo:
                challan.challanNo || challan.challanNumber || challan.id,
            });
          });
        }
      }
    });
    return items;
  };

  const calculateSubtotal = () => {
    const items = getAllItems();
    return items.reduce((sum, item) => {
      const price = item.pricePerUnit || item.price || 0;
      const qty = item.qty || item.quantity || 0;
      return sum + price * qty;
    }, 0);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleGenerateBill = async () => {
    if (!formData.customer) {
      alert("Please select a customer");
      return;
    }

    if (selectedChallans.length === 0) {
      alert("Please select at least one challan");
      return;
    }

    try {
      setLoading(true);

      // Prepare bill items from selected challans
      const items = getAllItems();

      const payload = {
        customerId: formData.customer,
        billDate: formData.invoiceDate,
        challanIds: selectedChallans,
        items: items.map((item) => ({
          productId: item.productId || item.categoryId,
          productName: item.productName || item.name || "Unknown Product",
          categoryId: item.categoryId,
          size: item.size || "",
          qty: item.qty || item.quantity || 0,
          pricePerUnit: item.pricePerUnit || item.price || 0,
          gstPercent: item.gstPercent || gst,
        })),
        discount: discount,
        gstPercent: gst,
      };

      console.log("Creating bill with payload:", payload);

      const bill = await billService.createBill(payload);

      alert("Bill created successfully!");
      navigate(`/vendor/bill-details/${bill.id || bill._id}`);
    } catch (error) {
      console.error("Create bill error:", error);

      let errorMessage = "Failed to create bill";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const items = getAllItems();

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
          {/* Customer & Date Section - ALWAYS VISIBLE */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="customer">Customer</label>
              <select
                id="customer"
                value={formData.customer}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="form-input"
                disabled={loading}
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option
                    key={customer._id || customer.id}
                    value={customer._id || customer.id}
                  >
                    {customer.customerName ||
                      customer.name ||
                      customer.businessName ||
                      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                      "Unnamed Customer"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="invoiceDate">Invoice Date</label>
              <input
                type="date"
                id="invoiceDate"
                value={formData.invoiceDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    invoiceDate: e.target.value,
                  }))
                }
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>

          {/* Items Section - ALWAYS VISIBLE */}
          <div className="items-section">
            <h2 className="section-title">Items</h2>
            {items.length > 0 ? (
              <div className="items-list">
                {items.map((item, index) => (
                  <div key={index} className="item-card">
                    <div className="item-info">
                      <div className="item-header">
                        <h3 className="item-name">
                          {item.productName || "Unknown Product"}
                        </h3>
                        <button className="remove-btn">
                          <MdDelete />
                        </button>
                      </div>
                      <p className="item-category">{item.category.name || "N/A"}</p>
                      <div className="item-details">
                        <div className="detail">
                          <span className="detail-label">Qty</span>
                          <span className="detail-value">
                            {item.qty || item.quantity || 0}
                          </span>
                        </div>
                        <div className="detail">
                          <span className="detail-label">Price</span>
                          <span className="detail-value">
                            ₹
                            {(
                              (item.pricePerUnit || item.price || 0) *
                              (item.qty || item.quantity || 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#86868b",
                  background: "#f9f9f9",
                  borderRadius: "12px",
                  border: "1px solid #e5e5e7",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px" }}>
                  {formData.customer
                    ? "No items yet. Please select challans below."
                    : "Please select a customer to view items."}
                </p>
              </div>
            )}
            <button className="add-challan-btn">
              <MdAdd style={{ marginRight: "4px" }} /> Add Challan
            </button>
          </div>

          {/* Challans Section - ALWAYS VISIBLE */}
          {formData.customer && (
            <>
              {availableChallans.length > 0 ? (
                <div className="challans-section">
                  {availableChallans.map((challan) => (
                    <label
                      key={challan._id || challan.id}
                      className="challan-card"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChallans.includes(
                          challan._id || challan.id,
                        )}
                        onChange={() =>
                          handleToggleChallan(challan._id || challan.id)
                        }
                        className="challan-checkbox"
                      />
                      <div className="challan-info">
                        <div className="challan-row">
                          <span className="challan-label">Challan No:</span>
                          <span className="challan-value">
                            {challan.challanNo ||
                              challan.challanNumber ||
                              challan.id ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="challan-row">
                          <span className="challan-label">Date:</span>
                          <span className="challan-value">
                            {challan.challanDate
                              ? formatDate(challan.challanDate)
                              : "N/A"}
                          </span>
                        </div>
                        <div className="challan-row">
                          <span className="challan-label">Total Amount:</span>
                          <span className="challan-value">
                            ₹
                            {(
                              challan.subtotal ||
                              challan.total ||
                              0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#86868b",
                    background: "#f9f9f9",
                    borderRadius: "12px",
                    border: "1px solid #e5e5e7",
                    marginBottom: "32px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    No challans found for this customer.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Summary Section - ALWAYS VISIBLE */}
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

          {/* Action Buttons - ALWAYS VISIBLE */}
          <div className="action-buttons">
            <button className="cancel-btn" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button
              className="generate-btn"
              onClick={handleGenerateBill}
              disabled={
                loading || !formData.customer || selectedChallans.length === 0
              }
            >
              {loading ? "Generating..." : "Generate Bill"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBill;
