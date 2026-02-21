import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./customer.scss";
import customerService from "../services/customerService";
import { CiEdit, CiTrash } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import {
  FiSearch,
  FiUpload,
  FiUserPlus,
  FiCamera,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
} from "react-icons/fi";
import { RiFileExcel2Line } from "react-icons/ri";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
];

const INITIAL_FORM = {
  customerName: "",
  mobileNumber: "",
  businessName: "",
  gstNumber: "",
  email: "",
  aadharNumber: "",
  priceValue: "",
  homeAddress: {
    streetNo: "",
    houseNo: "",
    residencyName: "",
    areaCity: "",
    state: "",
    pincode: "",
  },
  officeAddress: {
    officeNo: "",
    buildingNo: "",
    areaCity: "",
    state: "",
    pincode: "",
  },
  customerImage: null,
  status: "Active",
};

const ROWS_OPTIONS = [10, 20, 50, 100];

const Customer = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData"));
  const vendorId = vendorData?.id;

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addForm, setAddForm] = useState(INITIAL_FORM);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addAvatarPreview, setAddAvatarPreview] = useState(null);

  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const searchTimer = useRef(null);

  const fetchCustomers = async (search = searchQuery) => {
    if (!vendorId) {
      console.warn(
        "No vendorId found in localStorage. Cannot fetch customers.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      let data = [];
      if (search.trim()) {
        const res = await customerService.searchCustomers(search);
        data = Array.isArray(res)
          ? res
          : res?.data?.rows || res?.rows || res?.data || [];
      } else {
        const res = await customerService.getCustomers();
        data = res?.data?.rows || res?.rows || (Array.isArray(res) ? res : []);
      }

      setCustomers(Array.isArray(data) ? data : []);
      setTotalCustomers(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Failed to load customers. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [vendorId]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchCustomers(value);
    }, 400);
  };

  const validateForm = (form) => {
    if (!form.customerName.trim()) return "Customer name is required.";
    if (!form.mobileNumber.trim()) return "Mobile number is required.";

    if (!/^[0-9]{10}$/.test(form.mobileNumber)) {
      return "Please enter a valid 10-digit mobile number.";
    }

    if (form.email && form.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email))
        return "Please enter a valid email address.";
    }

    if (form.gstNumber && form.gstNumber.trim() !== "") {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(form.gstNumber))
        return "Please enter a valid 15-character GSTIN.";
    }

    if (form.homeAddress.pincode && form.homeAddress.pincode.length !== 6) {
      return "Home pin code must be 6 digits.";
    }
    if (form.officeAddress.pincode && form.officeAddress.pincode.length !== 6) {
      return "Office pin code must be 6 digits.";
    }

    return null;
  };

  const handleAddClick = () => {
    setAddForm(INITIAL_FORM);
    setAddAvatarPreview(null);
    setAddError("");
    setShowAddDrawer(true);
  };

  const handleFormChange = (e, targetForm = "add", subKey = null) => {
    let { name, value } = e.target;

    // Numeric restrictions
    if (
      ["mobileNumber", "priceValue", "aadharNumber"].includes(name) ||
      name === "pincode"
    ) {
      if (value !== "" && !/^\d+$/.test(value)) return;
    }

    // Auto-uppercase GST
    if (name === "gstNumber") value = value.toUpperCase();

    const setter = targetForm === "add" ? setAddForm : setEditForm;

    setter((prev) => {
      if (subKey) {
        return { ...prev, [subKey]: { ...prev[subKey], [name]: value } };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleImageChange = (e, target = "add") => {
    const file = e.target.files[0];
    if (!file) return;

    const setter = target === "add" ? setAddForm : setEditForm;
    const previewSetter =
      target === "add" ? setAddAvatarPreview : setEditAvatarPreview;

    setter((prev) => ({ ...prev, customerImage: file }));
    previewSetter(URL.createObjectURL(file));
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    const valErr = validateForm(addForm);
    if (valErr) return setAddError(valErr);

    try {
      setAddLoading(true);
      setAddError("");
      const fd = new FormData();
      fd.append("vendorId", vendorId);
      fd.append("customerName", addForm.customerName);
      fd.append("mobileNumber", addForm.mobileNumber);
      fd.append("businessName", addForm.businessName || "");
      fd.append("gstNumber", addForm.gstNumber || "");
      fd.append("email", addForm.email || "");
      fd.append("aadharNumber", addForm.aadharNumber || "");
      fd.append("priceValue", addForm.priceValue || "0");
      fd.append("homeAddress", JSON.stringify(addForm.homeAddress));
      fd.append("officeAddress", JSON.stringify(addForm.officeAddress));
      fd.append("status", "Active"); // Default to Active

      if (addForm.customerImage)
        fd.append("customerImage", addForm.customerImage);

      await customerService.createCustomer(fd);
      setShowAddDrawer(false);
      fetchCustomers();
    } catch (err) {
      setAddError(err.message || "Failed to create customer.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditClick = (cust, e) => {
    e.stopPropagation();
    setEditingCustomer(cust);
    setEditForm({
      customerName: cust.customerName || "",
      mobileNumber: cust.mobileNumber || "",
      businessName: cust.businessName || "",
      gstNumber: cust.gstNumber || "",
      email: cust.email || "",
      aadharNumber: cust.aadharNumber || "",
      priceValue: cust.pricePerProduct || cust.priceValue || "",
      homeAddress: cust.homeAddress
        ? typeof cust.homeAddress === "string"
          ? JSON.parse(cust.homeAddress)
          : cust.homeAddress
        : INITIAL_FORM.homeAddress,
      officeAddress: cust.officeAddress
        ? typeof cust.officeAddress === "string"
          ? JSON.parse(cust.officeAddress)
          : cust.officeAddress
        : INITIAL_FORM.officeAddress,
      customerImage: null,
    });
    setEditAvatarPreview(cust.customerImage);
    setEditError("");
    setShowEditDrawer(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    const valErr = validateForm(editForm);
    if (valErr) return setEditError(valErr);

    try {
      setEditLoading(true);
      setEditError("");
      const fd = new FormData();
      fd.append("customerName", editForm.customerName);
      fd.append("mobileNumber", editForm.mobileNumber);
      fd.append("businessName", editForm.businessName || "");
      fd.append("gstNumber", editForm.gstNumber || "");
      fd.append("email", editForm.email || "");
      fd.append("aadharNumber", editForm.aadharNumber || "");
      fd.append("priceValue", editForm.priceValue || "0");
      fd.append("homeAddress", JSON.stringify(editForm.homeAddress));
      fd.append("officeAddress", JSON.stringify(editForm.officeAddress));
      fd.append("vendorId", vendorId);

      if (editForm.customerImage)
        fd.append("customerImage", editForm.customerImage);
      if (editingCustomer.customerImage)
        fd.append("oldCustomerImage", editingCustomer.customerImage);

      await customerService.updateCustomer(
        editingCustomer.id || editingCustomer._id,
        fd,
      );
      setShowEditDrawer(false);
      fetchCustomers();
    } catch (err) {
      setEditError(err.message || "Update failed.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setDeletingCustomerId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const fd = new FormData();
      fd.append("status", "Inactive");
      fd.append("vendorId", vendorId);

      await customerService.updateCustomer(deletingCustomerId, fd);
      setShowDeleteModal(false);
      fetchCustomers();
    } catch (err) {
      alert("Failed to deactivate customer.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExcelExport = () => {
    const headers = ["Customer Name", "Business", "Mobile", "GST", "Email"];
    const rows = customers.map((c) => [
      c.customerName,
      c.businessName || "-",
      c.mobileNumber,
      c.gstNumber || "-",
      c.email || "-",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers.csv";
    link.click();
  };

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div className="sidebar-toggle">
          <FiChevronsLeft />
        </div>
        <h1>
          Customers <span className="version-badge">v2</span>
        </h1>
      </div>
      <div className="customer-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="toolbar-actions">
          <button className="action-btn upload-btn">
            <FiUpload /> Bulk Import
          </button>
          <button className="action-btn excel-btn" onClick={handleExcelExport}>
            <RiFileExcel2Line /> Export (xslx)
          </button>
          <button className="action-btn add-btn" onClick={handleAddClick}>
            <FiUserPlus /> Create Customer
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="customer-table-container">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>GSTIN</th>
              <th>Email</th>
              <th>Mobile No.</th>
              <th>Address</th>
              <th>City</th>
              <th>State</th>
              <th>Pincode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  Loading...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  No customers found
                </td>
              </tr>
            ) : (
              customers
                .slice(
                  (currentPage - 1) * rowsPerPage,
                  currentPage * rowsPerPage,
                )
                .map((cust) => {
                  const home = cust.homeAddress
                    ? typeof cust.homeAddress === "string"
                      ? JSON.parse(cust.homeAddress)
                      : cust.homeAddress
                    : {};
                  const fullAddress =
                    `${home.houseNo || ""} ${home.residencyName || ""} ${home.streetNo || ""}`.trim();

                  return (
                    <tr
                      key={cust.id || cust._id}
                      className="customer-row"
                      onClick={() =>
                        navigate(
                          `/vendor/customer-details/${cust.id || cust._id}`,
                        )
                      }
                    >
                      <td className="name-cell">{cust.customerName}</td>
                      <td style={{ fontFamily: "monospace" }}>
                        {cust.gstNumber || "—"}
                      </td>
                      <td>{cust.email || "—"}</td>
                      <td>{cust.mobileNumber}</td>
                      <td>{fullAddress || "—"}</td>
                      <td>{home.areaCity || "—"}</td>
                      <td>{home.state || "—"}</td>
                      <td>{home.pincode || "—"}</td>
                      <td
                        className="action-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="icon-btn edit"
                          onClick={(e) => handleEditClick(cust, e)}
                        >
                          <CiEdit />
                        </button>
                        <button
                          className="icon-btn delete"
                          onClick={(e) =>
                            handleDeleteClick(cust.id || cust._id, e)
                          }
                        >
                          <CiTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div className="rows-per-page">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {ROWS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="page-info">
            {totalCustomers > 0
              ? `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, totalCustomers)} of ${totalCustomers}`
              : "0-0 of 0"}
          </span>
        </div>
        <div className="pagination-controls">
          <div className="nav-btns">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <FiChevronLeft />
            </button>
            <button className="active">{currentPage}</button>
            <button
              disabled={currentPage * rowsPerPage >= totalCustomers}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {showAddDrawer && (
        <div className="drawer-overlay" onClick={() => setShowAddDrawer(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Add New Customer</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddDrawer(false)}
              >
                <IoClose />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="drawer-form">
              <div className="avatar-upload-wrap">
                {addAvatarPreview ? (
                  <img
                    src={addAvatarPreview}
                    className="avatar-preview"
                    alt="Preview"
                  />
                ) : (
                  <div
                    className="avatar-preview"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FiCamera size={30} color="#ccc" />
                  </div>
                )}
                <label htmlFor="add-avatar" className="upload-label">
                  Choose Customer Photo
                </label>
                <input
                  type="file"
                  id="add-avatar"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "add")}
                />
              </div>

              {addError && (
                <div
                  style={{
                    color: "#fa5252",
                    marginBottom: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {addError}
                </div>
              )}

              <div className="form-section">
                <span className="section-title">Primary Information</span>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={addForm.customerName}
                      onChange={(e) => handleFormChange(e)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Mobile Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={addForm.mobileNumber}
                      onChange={(e) => handleFormChange(e)}
                      placeholder="10-digit number"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={addForm.email}
                      onChange={(e) => handleFormChange(e)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={addForm.businessName}
                      onChange={(e) => handleFormChange(e)}
                      placeholder="Enter business name"
                    />
                  </div>
                  <div className="form-group">
                    <label>GST Number</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={addForm.gstNumber}
                      onChange={(e) => handleFormChange(e)}
                      placeholder="15-char GSTIN"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <span className="section-title">Home Address</span>
                <div className="form-grid">
                  <div className="form-group">
                    <label>House / Flat No.</label>
                    <input
                      type="text"
                      name="houseNo"
                      value={addForm.homeAddress.houseNo}
                      onChange={(e) =>
                        handleFormChange(e, "add", "homeAddress")
                      }
                      placeholder="e.g. 101"
                    />
                  </div>
                  <div className="form-group">
                    <label>Residency Name</label>
                    <input
                      type="text"
                      name="residencyName"
                      value={addForm.homeAddress.residencyName}
                      onChange={(e) =>
                        handleFormChange(e, "add", "homeAddress")
                      }
                      placeholder="Society name"
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="areaCity"
                      value={addForm.homeAddress.areaCity}
                      onChange={(e) =>
                        handleFormChange(e, "add", "homeAddress")
                      }
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={addForm.homeAddress.pincode}
                      onChange={(e) =>
                        handleFormChange(e, "add", "homeAddress")
                      }
                      placeholder="6 digits"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddDrawer(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={addLoading}
                >
                  {addLoading ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditDrawer && (
        <div
          className="drawer-overlay"
          onClick={() => setShowEditDrawer(false)}
        >
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Edit Customer</h2>
              <button
                className="close-btn"
                onClick={() => setShowEditDrawer(false)}
              >
                <IoClose />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="drawer-form">
              <div className="avatar-upload-wrap">
                {editAvatarPreview ? (
                  <img
                    src={editAvatarPreview}
                    className="avatar-preview"
                    alt="Preview"
                  />
                ) : (
                  <div
                    className="avatar-preview"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FiCamera size={30} color="#ccc" />
                  </div>
                )}
                <label htmlFor="edit-avatar" className="upload-label">
                  Change Customer Photo
                </label>
                <input
                  type="file"
                  id="edit-avatar"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "edit")}
                />
              </div>

              {editError && (
                <div
                  style={{
                    color: "#fa5252",
                    marginBottom: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {editError}
                </div>
              )}

              <div className="form-section">
                <span className="section-title">Primary Information</span>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={editForm.customerName}
                      onChange={(e) => handleFormChange(e, "edit")}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Mobile Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={editForm.mobileNumber}
                      onChange={(e) => handleFormChange(e, "edit")}
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={(e) => handleFormChange(e, "edit")}
                    />
                  </div>
                  <div className="form-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={editForm.businessName}
                      onChange={(e) => handleFormChange(e, "edit")}
                    />
                  </div>
                  <div className="form-group">
                    <label>GST Number</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={editForm.gstNumber}
                      onChange={(e) => handleFormChange(e, "edit")}
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <span className="section-title">Home Address</span>
                <div className="form-grid">
                  <div className="form-group">
                    <label>House / Flat No.</label>
                    <input
                      type="text"
                      name="houseNo"
                      value={editForm.homeAddress.houseNo}
                      onChange={(e) =>
                        handleFormChange(e, "edit", "homeAddress")
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Residency Name</label>
                    <input
                      type="text"
                      name="residencyName"
                      value={editForm.homeAddress.residencyName}
                      onChange={(e) =>
                        handleFormChange(e, "edit", "homeAddress")
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="areaCity"
                      value={editForm.homeAddress.areaCity}
                      onChange={(e) =>
                        handleFormChange(e, "edit", "homeAddress")
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={editForm.homeAddress.pincode}
                      onChange={(e) =>
                        handleFormChange(e, "edit", "homeAddress")
                      }
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditDrawer(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={editLoading}
                >
                  {editLoading ? "Updating..." : "Update Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-box delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-content" style={{ padding: "30px" }}>
              <div className="trash-icon">
                <CiTrash />
              </div>
              <h3>Deactivate Customer?</h3>
              <p>
                This customer will be marked as inactive and removed from active
                lists.
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  className="btn-cancel"
                  style={{ flex: 1 }}
                  onClick={() => setShowDeleteModal(false)}
                >
                  No, Keep
                </button>
                <button
                  className="btn-delete"
                  style={{ flex: 1 }}
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Processing..." : "Yes, Deactivate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
