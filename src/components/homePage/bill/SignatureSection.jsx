import React from "react";
import "./SignatureSection.scss";

const SignatureSection = ({
  enabled,
  setEnabled,
  stampPreview,
  stampFile,
  onUpload,
  onClear,
}) => {
  return (
    <div className="signature-section card">
      <div className="sig-header">
        <div className="card-title">Signature &amp; Stamp</div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="slider" />
          <span className="toggle-label">
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>

      {enabled && (
        <div className="sig-body">
          <div className="sig-text">
            <p>
              Certified that the particulars given above are true and correct,
            </p>
            <p className="company-name">For My Company</p>
          </div>

          <div className="stamp-area">
            {stampPreview ? (
              <div className="stamp-preview">
                <img src={stampPreview} alt="Stamp preview" />
                <div className="stamp-overlay">
                  <button className="btn-remove-stamp" onClick={onClear}>
                    ✕ Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="stamp-drop-zone">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUpload}
                  style={{ display: "none" }}
                />
                <div className="drop-icon">🖼</div>
                <p>Click to upload stamp / signature</p>
                <span>PNG, JPG supported</span>
              </label>
            )}
          </div>

          {stampPreview && (
            <div className="stamp-actions">
              <button className="btn-clear-stamp" onClick={onClear}>
                🗑 Clear
              </button>
              <label className="btn-replace-stamp">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUpload}
                  style={{ display: "none" }}
                />
                ⬆ Replace
              </label>
            </div>
          )}

          <p className="auth-sig">Authorised Signatory</p>
        </div>
      )}
    </div>
  );
};

export default SignatureSection;
