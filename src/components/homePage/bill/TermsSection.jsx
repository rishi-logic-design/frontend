import React, { useState } from "react";
import "./TermsSection.scss";

const DEFAULT_TERMS = [
  "This is an electronically generated document.",
  "All disputes are subject to seller city jurisdiction.",
  "Goods once sold will not be taken back.",
  "Payment due within 30 days of invoice date.",
  "Interest @18% p.a. will be charged on overdue amounts.",
];

const TermsSection = ({ terms, setTerms }) => {
  const [showModal, setShowModal] = useState(false);
  const [newInput, setNewInput] = useState("");
  const [templateVal, setTemplateVal] = useState("");

  const handleTemplate = (val) => {
    setTemplateVal(val);
    if (val === "default") {
      setTerms([
        "This is an electronically generated document.",
        "All disputes are subject to seller city jurisdiction.",
      ]);
    }
  };

  const addTerm = () => {
    if (newInput.trim()) {
      setTerms([...terms, newInput.trim()]);
      setNewInput("");
      setShowModal(false);
    }
  };

  return (
    <div className="terms-section card">
      <div className="terms-header">
        <div className="card-title">Terms &amp; Conditions</div>
        <div className="terms-actions">
          <select
            value={templateVal}
            onChange={(e) => handleTemplate(e.target.value)}
            className="template-sel"
          >
            <option value="">Select Template</option>
            <option value="default">Default Terms</option>
          </select>
          <button className="btn-add-terms" onClick={() => setShowModal(true)}>
            + Add Term
          </button>
          {terms.length > 0 && (
            <button className="btn-clear-terms" onClick={() => setTerms([])}>
              ✕ Clear All
            </button>
          )}
        </div>
      </div>

      <div className="terms-list">
        {terms.length === 0 ? (
          <p className="no-terms">No terms added yet.</p>
        ) : (
          terms.map((t, i) => (
            <div key={i} className="term-item">
              <span className="term-idx">{i + 1}.</span>
              <span className="term-text">{t}</span>
              <button
                className="btn-remove-term"
                onClick={() => setTerms(terms.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Suggested quick-add */}
      <div className="suggestions">
        <span className="sug-label">Quick add:</span>
        {DEFAULT_TERMS.filter((d) => !terms.includes(d))
          .slice(0, 3)
          .map((d, i) => (
            <button
              key={i}
              className="sug-btn"
              onClick={() => setTerms([...terms, d])}
            >
              + {d.slice(0, 40)}…
            </button>
          ))}
      </div>

      {showModal && (
        <div
          className="terms-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>Add Term</span>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <textarea
              autoFocus
              rows={4}
              placeholder="Enter your term or condition…"
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !e.shiftKey &&
                (e.preventDefault(), addTerm())
              }
            />
            <div className="modal-foot">
              <button
                className="btn-cancel-modal"
                onClick={() => {
                  setNewInput("");
                  setShowModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-save-modal"
                onClick={addTerm}
                disabled={!newInput.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsSection;
