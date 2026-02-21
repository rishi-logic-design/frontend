import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdCloudUpload,
  MdSave,
  MdClose,
  MdReceipt,
  MdCalendarToday,
  MdCheckCircle,
  MdError,
} from "react-icons/md";
import purchaseService from "../../services/purchaseService";
import vendorVendorService from "../../services/vendorVendorService";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import "./uploadPurchase.scss";

const UploadPurchase = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showModal, setShowModal] = useState({
    show: false,
    success: true,
    message: "",
  });

  const [formData, setFormData] = useState({
    purchaseInvoiceNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    totalAmount: "",
    sellerId: "",
    billUrl: "",
  });

  useEffect(() => {
    fetchSellers();
    // Auto-generate a dummy number if needed, but let user enter it too
  }, []);

  const fetchSellers = async () => {
    try {
      const res = await vendorVendorService.getVendors();
      setSellers(res?.data?.rows || res?.rows || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const storageRef = ref(
      storage,
      `purchase-bills/${Date.now()}_${file.name}`,
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        setUploadProgress(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        );
      },
      (error) => {
        console.error("Upload error:", error);
        setIsUploading(false);
        setShowModal({
          show: true,
          success: false,
          message: "Failed to upload file. Please try again.",
        });
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((prev) => ({ ...prev, billUrl: url }));
        setIsUploading(false);
      },
    );
  };

  const handleSubmit = async () => {
    if (!formData.sellerId)
      return setShowModal({
        show: true,
        success: false,
        message: "Please select a seller",
      });
    if (!formData.purchaseInvoiceNumber)
      return setShowModal({
        show: true,
        success: false,
        message: "Please enter invoice number",
      });
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0)
      return setShowModal({
        show: true,
        success: false,
        message: "Please enter a valid bill amount",
      });

    try {
      setLoading(true);

      // Validation: Check for duplicate invoice number for the same seller
      const existingData = await purchaseService.getPurchases({ size: 1000 });
      const allPurchases = existingData?.data?.rows || existingData?.rows || [];
      const isDuplicate = allPurchases.some(
        (p) =>
          (p.sellerId === formData.sellerId ||
            p.VendorId === formData.sellerId) &&
          p.purchaseNumber === formData.purchaseInvoiceNumber,
      );

      if (isDuplicate) {
        setLoading(false);
        return setShowModal({
          show: true,
          success: false,
          message: `Invoice number "${formData.purchaseInvoiceNumber}" already exists for this seller. Please use a unique number.`,
        });
      }

      const amountValue = parseFloat(formData.totalAmount);
      const payload = {
        purchaseNumber: formData.purchaseInvoiceNumber,
        purchaseDate: formData.purchaseDate,
        totalAmount: amountValue,
        sellerId: formData.sellerId,
        billUrl: formData.billUrl,
        isUploaded: true,
        status: "unpaid",
        paidAmount: 0,
        pendingAmount: amountValue,
      };

      await purchaseService.createPurchase(payload);
      setShowModal({
        show: true,
        success: true,
        message: "Purchase bill recorded successfully!",
      });
      setTimeout(() => navigate("/vendor/purchases"), 2000);
    } catch (error) {
      console.error("Submit error:", error);
      setShowModal({
        show: true,
        success: false,
        message: error.message || "Failed to save purchase",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-purchase-page">
      {showModal.show && (
        <div className="custom-modal-overlay">
          <div
            className={`custom-modal ${showModal.success ? "success" : "error"}`}
          >
            <div
              className={`modal-icon ${showModal.success ? "success" : "error"}`}
            >
              {showModal.success ? <MdCheckCircle /> : <MdError />}
            </div>
            <h3>{showModal.success ? "Success" : "Error"}</h3>
            <p>{showModal.message}</p>
            {!showModal.success && (
              <button
                className="close-btn"
                onClick={() => setShowModal({ ...showModal, show: false })}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      <div className="page-header-container">
        <div className="header-info">
          <button className="back-btn-pill" onClick={() => navigate(-1)}>
            <MdArrowBack /> Back
          </button>
          <h1>Upload Purchase Bill</h1>
          <p>Quickly record and upload your physical purchase invoices</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            className={`btn-dark ${loading ? "disabled" : ""}`}
            onClick={handleSubmit}
            disabled={loading || isUploading}
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <MdSave /> Save Purchase
              </>
            )}
          </button>
        </div>
      </div>

      <div className="upload-content-card">
        <div className="form-main-title">Record New Bill</div>

        <div className="form-sections-grid">
          {/* Section 1: Basic Info */}
          <div className="form-section full-span">
            <div className="input-group-row">
              <div className="input-field">
                <label>Purchase Invoice Number</label>
                <div className="icon-input-wrapper has-icon">
                  <input
                    type="text"
                    placeholder="Enter Invoice No."
                    value={formData.purchaseInvoiceNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchaseInvoiceNumber: e.target.value,
                      })
                    }
                  />
                  <MdReceipt className="field-icon" />
                </div>
              </div>
              <div className="input-field">
                <label>Purchase Date</label>
                <div className="icon-input-wrapper has-icon">
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                  />
                  <MdCalendarToday className="field-icon" />
                </div>
              </div>
            </div>

            <div className="input-field amount-field">
              <label>Total Amount</label>
              <div className="icon-input-wrapper has-currency">
                <span className="field-currency">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, totalAmount: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 2: Seller Details */}
          <div className="form-section half-span border-right">
            <div className="section-title">Seller Details</div>
            <div className="seller-flex-container">
              <div className="input-field" style={{ marginBottom: 0 }}>
                <label>Select Seller</label>
                <select
                  value={formData.sellerId}
                  onChange={(e) =>
                    setFormData({ ...formData, sellerId: e.target.value })
                  }
                >
                  <option value="">Choose a seller...</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.vendorName}{" "}
                      {s.businessName ? `(${s.businessName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-add-new"
                onClick={() => navigate("/vendor/vendor")}
              >
                + New
              </button>
            </div>
          </div>

          {/* Section 3: File Upload */}
          <div className="form-section half-span">
            <div className="section-title">Upload Bill (Optional)</div>
            <div
              className="file-upload-container"
              onClick={() =>
                document.getElementById("bill-upload-input").click()
              }
            >
              {formData.billUrl ? (
                <div className="file-success">
                  <MdReceipt className="file-icon" />
                  <div className="file-details">
                    <h4>Invoice Uploaded!</h4>
                    <p>Click to replace the file</p>
                  </div>
                  <button
                    className="btn-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, billUrl: "" });
                    }}
                  >
                    <MdClose />
                  </button>
                </div>
              ) : (
                <div className="upload-content">
                  <MdCloudUpload className="upload-icon" />
                  <div className="upload-text">
                    <h4>
                      {isUploading
                        ? `Uploading... ${uploadProgress}%`
                        : "Click to select invoice file"}
                    </h4>
                    <p>Supports PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                </div>
              )}
              <input
                id="bill-upload-input"
                type="file"
                hidden
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPurchase;
