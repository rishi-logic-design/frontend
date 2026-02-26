import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiPrinter } from "react-icons/fi";
import salesDebitNoteService from "../../services/salesDebitNoteService";
import { toast } from "react-toastify";
import "./creditNoteDetails.scss";

const SalesDebitNoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const vendorData = JSON.parse(localStorage.getItem("vendorData") || "{}");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await salesDebitNoteService.getSalesDebitNoteById(id);
      setData(res?.data || res);
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Failed to load sales debit note details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="details-loading">Loading details...</div>;
  if (!data)
    return <div className="details-error">Sales Debit Note not found.</div>;

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="credit-note-details-container">
      <div className="details-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
          <h1>Sales Debit Note Details</h1>
        </div>
        <div className="header-right">
          <button className="action-btn outline">
            <FiPrinter /> Print
          </button>
          <button
            className="action-btn primary"
            onClick={() => salesDebitNoteService.downloadPDF(id)}
          >
            <FiDownload /> Download PDF
          </button>
        </div>
      </div>

      <div className="details-card invoice-style">
        <div className="invoice-header">
          <div className="vendor-info">
            <h2>{vendorData.businessName || "My Business"}</h2>
            <p>{vendorData.address || "Address info"}</p>
            <p>GSTIN: {vendorData.gst || "N/A"}</p>
          </div>
          <div className="invoice-meta">
            <div className="meta-item">
              <label>Note No:</label>
              <span>{data.noteNumber}</span>
            </div>
            <div className="meta-item">
              <label>Date:</label>
              <span>{formatDate(data.noteDate)}</span>
            </div>
            <div className="meta-item">
              <label>Status:</label>
              <span
                className={`status-badge ${data.status?.toLowerCase() || "pending"}`}
              >
                {data.status || "Pending"}
              </span>
            </div>
          </div>
        </div>

        <hr />

        <div className="invoice-parties">
          <div className="party-box">
            <label>Bill To:</label>
            <h4>
              {data.customer?.customerName ||
                data.customerName ||
                "Customer Name"}
            </h4>
            <p>{data.customer?.businessName}</p>
            <p>{data.customer?.billingAddress || data.customer?.address}</p>
            {data.customer?.gst && <p>GSTIN: {data.customer.gst}</p>}
          </div>
        </div>

        <div className="items-table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>HSN/SAC</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">GST %</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.itemName}</td>
                  <td>{item.hsn || "—"}</td>
                  <td className="text-right">{item.qty}</td>
                  <td className="text-right">
                    ₹{parseFloat(item.price).toLocaleString()}
                  </td>
                  <td className="text-right">{item.gstPercent}%</td>
                  <td className="text-right font-bold">
                    ₹{parseFloat(item.total).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-footer">
          <div className="notes-section">
            <label>Terms & Conditions:</label>
            <p>{data.termsAndConditions || "No terms specified."}</p>
            {data.note && (
              <div style={{ marginTop: "10px" }}>
                <label>Remarks:</label>
                <p>{data.note}</p>
              </div>
            )}
          </div>
          <div className="summary-section">
            <div className="summary-row">
              <label>Taxable Amount:</label>
              <span>
                ₹{(parseFloat(data.taxableAmount) || 0).toLocaleString()}
              </span>
            </div>
            <div className="summary-row">
              <label>GST Total:</label>
              <span>₹{(parseFloat(data.gstTotal) || 0).toLocaleString()}</span>
            </div>
            {parseFloat(data.otherCharge) > 0 && (
              <div className="summary-row">
                <label>Other Charges:</label>
                <span>₹{parseFloat(data.otherCharge).toLocaleString()}</span>
              </div>
            )}
            {parseFloat(data.invoiceDiscount) > 0 && (
              <div className="summary-row">
                <label>Discount:</label>
                <span>
                  - ₹{parseFloat(data.invoiceDiscount).toLocaleString()}
                </span>
              </div>
            )}
            <div className="summary-row grand-total">
              <label>Final Amount:</label>
              <span>
                ₹{(parseFloat(data.finalAmount) || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {data.showSignature && (
          <div className="signature-area">
            <label>Authorized Signature</label>
            {data.signatureImage ? (
              <img src={data.signatureImage} alt="Signature" />
            ) : (
              <div className="sig-placeholder">___________________</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDebitNoteDetails;
