import React, { useState } from "react";

import "./downloadLedgerModal.scss";

const DownloadLedgerModal = ({ isOpen, onClose, onDownload }) => {
  const [format, setFormat] = useState("PDF");
  const [includeZeroBalance, setIncludeZeroBalance] = useState(true);

  if (!isOpen) return null;

  const handleDownload = () => {
    onDownload({ format, includeZeroBalance });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="download-ledger-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="format-selector">
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="PDF">PDF</option>
            <option value="CSV">CSV</option>
          </select>
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="zeroBalance"
            checked={includeZeroBalance}
            onChange={(e) => setIncludeZeroBalance(e.target.checked)}
          />
          <label htmlFor="zeroBalance">Include Parties with Zero Balance</label>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="download-btn" onClick={handleDownload}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadLedgerModal;
