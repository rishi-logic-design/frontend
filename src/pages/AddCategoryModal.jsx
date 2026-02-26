import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "./addCategoryModal.scss";

const AddCategoryModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await onSave(formData);
      setFormData({ name: "", description: "" });
      onClose();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-modal-overlay" onClick={onClose}>
      <div
        className="category-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{initialData ? "Edit Category" : "Add Category"}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-body">
            <div className="input-field">
              <label>Category name</label>
              <input
                type="text"
                placeholder="Category name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                autoFocus
                required
              />
            </div>
            <div className="input-field">
              <label>Description (Optional)</label>
              <textarea
                placeholder="Enter category description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="submit"
              className="btn-create"
              disabled={loading || !formData.name.trim()}
            >
              {loading
                ? "Saving..."
                : initialData
                  ? "Update Category"
                  : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
