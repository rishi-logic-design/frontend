import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./addVendorPage.scss";
import vendorVendorApiService from "../../services/vendorVendorService";
import { CiEdit, CiTrash } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import {
  FiSearch,
  FiUpload,
  FiUserPlus,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
} from "react-icons/fi";
import { RiFileExcel2Line } from "react-icons/ri";
import { toast } from "react-toastify";

const ROWS_OPTIONS = [10, 25, 50, 100];

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

const EMPTY_EDIT_FORM = {
  vendorName: "",
  email: "",
  gst: "",
  mobile: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
};

const AddVendorPage = () => {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_EDIT_FORM);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingVendorId, setDeletingVendorId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const bulkInputRef = useRef(null);
  const searchTimer = useRef(null);

  const fetchVendors = async (
    page = currentPage,
    size = rowsPerPage,
    search = searchQuery,
  ) => {
    try {
      setLoading(true);
      setError("");
      const res = await vendorVendorApiService.getVendors({
        page,
        size,
        search: search || undefined,
      });
      const data = res?.data?.data || res?.data || {};

      if (data.rows) {
        setVendors(data.rows);
        setTotalVendors(data.total || data.rows.length);
        setTotalPages(
          data.totalPages || Math.ceil((data.total || data.rows.length) / size),
        );
      } else if (Array.isArray(data)) {
        setVendors(data);
        setTotalVendors(data.length);
        setTotalPages(Math.ceil(data.length / size));
      } else {
        setVendors([]);
        setTotalVendors(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError("Failed to load vendors. Please try again.");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(currentPage, rowsPerPage, searchQuery);
  }, [currentPage, rowsPerPage]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchVendors(1, rowsPerPage, value);
    }, 400);
  };

  const startRow = totalVendors === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, totalVendors);

  const handleAddClick = () => {
    setAddForm(EMPTY_EDIT_FORM);
    setAddError("");
    setShowAddDrawer(true);
  };

  const handleFormChange = (e, type = "add") => {
    let { name, value } = e.target;
    // Restrict mobile and pinCode to numbers only
    if (
      (name === "mobile" || name === "pinCode") &&
      value !== "" &&
      !/^\d+$/.test(value)
    ) {
      return;
    }
    // Auto-uppercase GST
    if (name === "gst") {
      value = value.toUpperCase();
    }

    if (type === "add") {
      setAddForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateVendorForm = (form) => {
    const { vendorName, mobile, email, pinCode, gst } = form;

    if (!vendorName.trim()) return "Vendor name is required.";
    if (!mobile.trim()) return "Mobile number is required.";

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return "Please enter a valid 10-digit mobile number.";
    }

    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return "Please enter a valid email address.";
      }
    }

    if (gst && gst.trim() !== "") {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gst)) {
        return "Please enter a valid 15-character GSTIN.";
      }
    }

    if (pinCode && pinCode.trim() !== "") {
      const pinCodeRegex = /^[0-9]{6}$/;
      if (!pinCodeRegex.test(pinCode)) {
        return "Please enter a valid 6-digit pin code.";
      }
    }

    return null;
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    const validationError = validateVendorForm(addForm);
    if (validationError) {
      setAddError(validationError);
      return;
    }

    try {
      setAddLoading(true);
      setAddError("");
      await vendorVendorApiService.createVendor({
        ...addForm,
        status: "Active",
      });
      setShowAddDrawer(false);
      fetchVendors(1, rowsPerPage, searchQuery);
      setCurrentPage(1);
    } catch (err) {
      console.error("Create failed:", err);
      const msg = err?.response?.data?.message || "Failed to create vendor.";
      setAddError(msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditClick = (vendor, e) => {
    e.stopPropagation();
    setEditingVendor(vendor);
    setEditForm({
      vendorName: vendor.vendorName || "",
      email: vendor.email || "",
      gst: vendor.gst || "",
      mobile: vendor.mobile || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      pinCode: vendor.pinCode || "",
    });
    setEditError("");
    setShowEditDrawer(true);
  };

  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    const validationError = validateVendorForm(editForm);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    try {
      setEditLoading(true);
      setEditError("");
      await vendorVendorApiService.updateVendor(editingVendor.id, editForm);
      setShowEditDrawer(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (err) {
      console.error("Update failed:", err);
      const msg = err?.response?.data?.message || "Failed to update vendor.";
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (vendorId, e) => {
    e.stopPropagation();
    setDeletingVendorId(vendorId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await vendorVendorApiService.updateVendor(deletingVendorId, {
        status: "Inactive",
      });
      setShowDeleteModal(false);
      setDeletingVendorId(null);
      fetchVendors();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(
        err?.response?.data?.message || "Failed to deactivate vendor.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExcelExport = () => {
    if (vendors.length === 0) return toast.error("No vendors to export.");
    const headers = [
      "S.No",
      "Vendor Name",
      "Email",
      "GSTIN",
      "Mobile No.",
      "Address",
      "City",
      "State",
      "Pin Code",
    ];
    const rows = vendors.map((v, i) => [
      i + 1,
      v.vendorName || "",
      v.email || "",
      v.gst || "",
      v.mobile || "",
      v.address || "",
      v.city || "",
      v.state || "",
      v.pinCode || "",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vendors_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toast.info(
      `Bulk upload: "${file.name}" selected. Backend integration pending.`,
    );
    e.target.value = "";
  };

  return (
    <div className="vendor-page">
      <div className="vendor-header">
        <h1>
          Vendors <span className="version-badge">v2</span>
        </h1>
      </div>

      <div className="vendor-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="toolbar-actions">
          <button
            className="action-btn upload-btn"
            onClick={() => bulkInputRef.current?.click()}
          >
            <FiUpload />
            Bulk Import
          </button>
          <input
            ref={bulkInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleBulkUpload}
          />

          <button className="action-btn excel-btn" onClick={handleExcelExport}>
            <RiFileExcel2Line />
            Export (xslx)
          </button>

          <button
            className="action-btn add-vendor-btn"
            onClick={handleAddClick}
          >
            <FiUserPlus />+ Create Vendor
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="vendor-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading vendors...</p>
          </div>
        ) : (
          <table className="vendor-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Email</th>
                <th>GSTIN</th>
                <th>Mobile No.</th>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>Pancard</th>
                <th>Pincode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-row">
                    <div className="empty-state">
                      <FiUserPlus size={40} />
                      <p>No vendors found</p>
                      <span>Add your first vendor to get started</span>
                    </div>
                  </td>
                </tr>
              ) : (
                vendors.map((vendor, index) => (
                  <tr key={vendor.id} className="vendor-row">
                    <td className="name-cell">{vendor.vendorName || "—"}</td>
                    <td className="email-cell">{vendor.email || "—"}</td>
                    <td className="gstin-cell">{vendor.gst || "—"}</td>
                    <td className="mobile-cell">{vendor.mobile || "—"}</td>
                    <td className="address-cell">
                      {vendor.address ? `${vendor.address}` : "—"}
                    </td>
                    <td>{vendor.city || "—"}</td>
                    <td>{vendor.state || "—"}</td>
                    <td>{vendor.pan || vendor.pancard || "—"}</td>
                    <td>{vendor.pinCode || "—"}</td>
                    <td className="action-cell">
                      <button
                        className="icon-btn edit-icon-btn"
                        onClick={(e) => handleEditClick(vendor, e)}
                      >
                        <CiEdit />
                      </button>
                      <button
                        className="icon-btn delete-icon-btn"
                        onClick={(e) => handleDeleteClick(vendor.id, e)}
                      >
                        <CiTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="vendor-pagination">
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
            {totalVendors > 0
              ? `${startRow}-${endRow} of ${totalVendors}`
              : "0-0 of 0"}
          </span>
        </div>

        <div className="pagination-controls">
          <div className="nav-btns">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <FiChevronLeft />
            </button>
            <button className="active">{currentPage}</button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
              <h2>Add New Vendor</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddDrawer(false)}
              >
                <IoClose />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="drawer-form">
              <span className="section-title">Primary Information</span>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>
                    Vendor Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="vendorName"
                    value={addForm.vendorName}
                    onChange={(e) => handleFormChange(e, "add")}
                    placeholder="Enter vendor name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Mobile No. <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={addForm.mobile}
                    onChange={(e) => handleFormChange(e, "add")}
                    placeholder="10-digit number"
                    required
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={addForm.email}
                    onChange={(e) => handleFormChange(e, "add")}
                    placeholder="Enter email"
                  />
                </div>

                <div className="form-group">
                  <label>GSTIN</label>
                  <input
                    type="text"
                    name="gst"
                    value={addForm.gst}
                    onChange={(e) => handleFormChange(e, "add")}
                    placeholder="Enter GSTIN"
                    maxLength={15}
                  />
                </div>
              </div>

              <span className="section-title">Address Details</span>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={addForm.address}
                    onChange={(e) => handleFormChange(e, "add")}
                    placeholder="Enter address"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={addForm.city}
                    onChange={(e) => handleFormChange(e, "add")}
                    placeholder="Enter city"
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <select
                    name="state"
                    value={addForm.state}
                    onChange={(e) => handleFormChange(e, "add")}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Pin Code</label>
                  <input
                    type="text"
                    name="pinCode"
                    value={addForm.pinCode}
                    onChange={(e) => handleFormChange(e, "add")}
                    placeholder="6-digit code"
                    maxLength={6}
                  />
                </div>
              </div>

              {addError && (
                <div
                  style={{
                    color: "#fa5252",
                    marginTop: "15px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {addError}
                </div>
              )}

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
                  {addLoading ? "Creating..." : "Create Vendor"}
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
              <h2>Edit Vendor</h2>
              <button
                className="close-btn"
                onClick={() => setShowEditDrawer(false)}
              >
                <IoClose />
              </button>
            </div>

            <form onSubmit={handleUpdateVendor} className="drawer-form">
              <span className="section-title">Primary Information</span>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>
                    Vendor Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="vendorName"
                    value={editForm.vendorName}
                    onChange={(e) => handleFormChange(e, "edit")}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Mobile No. <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={editForm.mobile}
                    onChange={(e) => handleFormChange(e, "edit")}
                    required
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={(e) => handleFormChange(e, "edit")}
                  />
                </div>

                <div className="form-group">
                  <label>GSTIN</label>
                  <input
                    type="text"
                    name="gst"
                    value={editForm.gst}
                    onChange={(e) => handleFormChange(e, "edit")}
                    maxLength={15}
                  />
                </div>
              </div>

              <span className="section-title">Address Details</span>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={(e) => handleFormChange(e, "edit")}
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={editForm.city}
                    onChange={(e) => handleFormChange(e, "edit")}
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <select
                    name="state"
                    value={editForm.state}
                    onChange={(e) => handleFormChange(e, "edit")}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Pin Code</label>
                  <input
                    type="text"
                    name="pinCode"
                    value={editForm.pinCode}
                    onChange={(e) => handleFormChange(e, "edit")}
                    maxLength={6}
                  />
                </div>
              </div>

              {editError && (
                <div
                  style={{
                    color: "#fa5252",
                    marginTop: "15px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {editError}
                </div>
              )}

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
                  {editLoading ? "Updating..." : "Update Vendor"}
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="trash-icon">
              <CiTrash />
            </div>
            <h3>Delete Vendor</h3>
            <p>
              Are you sure you want to deactivate this vendor? This action will
              mark the vendor as inactive.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="btn-delete"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Marking Inactive..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVendorPage;
