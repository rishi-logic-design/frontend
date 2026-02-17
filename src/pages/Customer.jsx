import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./customer.scss";
import customerService from "../services/customerService";
import { CiEdit, CiTrash } from "react-icons/ci";
import { IoClose } from "react-icons/io5";

const Customer = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData"));
  const vendorId = vendorData?.id;

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customerName: "",
    businessName: "",
    mobileNumber: "",
    email: "",
    gstNumber: "",
    customerImage: null,
  });

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
  const handleDeleteCustomer = async (customerId, imageUrl) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?",
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      await customerService.deleteCustomer(customerId, imageUrl);
      fetchCustomers(); // refresh list
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete customer");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (customer, e) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({
      customerName: customer.customerName || "",
      businessName: customer.businessName || "",
      mobileNumber: customer.mobileNumber || "",
      email: customer.email || "",
      gstNumber: customer.gstNumber || "",
      customerImage: null,
    });
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setFormData({
      customerName: "",
      businessName: "",
      mobileNumber: "",
      email: "",
      gstNumber: "",
      customerImage: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        customerImage: file,
      }));
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const updateFormData = new FormData();

      updateFormData.append("customerName", formData.customerName);
      updateFormData.append("businessName", formData.businessName);
      updateFormData.append("mobileNumber", formData.mobileNumber);
      updateFormData.append("email", formData.email);
      updateFormData.append("gstNumber", formData.gstNumber);
      updateFormData.append("vendorId", vendorId);

      if (formData.customerImage) {
        updateFormData.append("customerImage", formData.customerImage);
      }

      if (editingCustomer.customerImage) {
        updateFormData.append(
          "oldCustomerImage",
          editingCustomer.customerImage,
        );
      }

      await customerService.updateCustomer(
        editingCustomer.id || editingCustomer._id,
        updateFormData,
      );

      fetchCustomers();
      handleModalClose();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update customer");
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
                <div
                  className="customer-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="edit-btn"
                    onClick={(e) => handleEditClick(customers, e)}
                  >
                    <CiEdit />
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      handleDeleteCustomer(
                        customers.id || customers._id,
                        customers.customerImage,
                      )
                    }
                  >
                    <CiTrash />
                  </button>
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

      {showEditModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Customer</h2>
              <button className="modal-close-btn" onClick={handleModalClose}>
                <IoClose />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="modal-form">
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Customer Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {editingCustomer?.customerImage && !formData.customerImage && (
                  <img
                    src={editingCustomer.customerImage}
                    alt="Current"
                    className="current-image-preview"
                  />
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleModalClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Updating..." : "Update Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
