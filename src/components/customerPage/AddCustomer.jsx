import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./addCustomer.scss";
import customerService from "../../services/customerService";

const AddCustomer = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData"));
  const vendorId = vendorData?.id;
  const [formData, setFormData] = useState({
    customerName: "",
    mobileNumber: "",
    businessName: "",
    gstNumber: "",
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
    aadharNumber: "",
    price: "",
    priceValue: "",
    customerImage: null,
  });

  const [avatar, setAvatar] = useState("👨‍💼");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (type, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      customerImage: file,
    }));

    setAvatar(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!vendorId) return alert("Vendor not found");
    console.log("Form Data to be submitted:", formData);
    try {
      setLoading(true);

      const fd = new FormData();

      fd.append("vendorId", vendorId);
      fd.append("customerName", formData.customerName);
      fd.append("mobileNumber", formData.mobileNumber);
      fd.append("businessName", formData.businessName);
      fd.append("gstNumber", formData.gstNumber);
      fd.append("aadharNumber", formData.aadharNumber);
      fd.append("pricePerProduct", Number(formData.priceValue || 0));

      fd.append("homeAddress", JSON.stringify(formData.homeAddress));
      fd.append("officeAddress", JSON.stringify(formData.officeAddress));

      fd.append("price", formData.price);
      fd.append("priceValue", formData.priceValue);

      if (formData.customerImage) {
        fd.append("customerImage", formData.customerImage);
      }

      await customerService.createCustomer(fd);

      navigate("/vendor/customer");
    } catch (error) {
      console.error(error);
      alert("Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-customer-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Add Customer</h1>
      </div>

      <div className="page-content">
        <div className="customer-form">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-display">
              {avatar && avatar.startsWith("blob") ? (
                <img src={avatar} alt="avatar" className="avatar-icon" />
              ) : (
                <span className="avatar-icon">{avatar}</span>
              )}
              <label htmlFor="avatar-upload" className="avatar-edit">
                📷
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="avatar-input"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="customerName">Customer Name</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Enter Customer Name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobileNumber">Mobile Number</label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                placeholder="Enter Mobile Number"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="businessName">Business Name</label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Enter Business Name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gstNumber">GST Number</label>
              <input
                type="text"
                id="gstNumber"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                placeholder="Enter GST Number"
                className="form-input"
              />
            </div>
          </div>

          {/* Home Address */}
          <div className="form-section">
            <h3 className="section-title">Home Address</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="homeStreetNo">Street No. (optional)</label>
                <input
                  type="text"
                  id="homeStreetNo"
                  value={formData.homeAddress.streetNo}
                  onChange={(e) =>
                    handleAddressChange(
                      "homeAddress",
                      "streetNo",
                      e.target.value,
                    )
                  }
                  placeholder="Street No. (optional)"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="homeHouseNo">House No.</label>
                <input
                  type="text"
                  id="homeHouseNo"
                  value={formData.homeAddress.houseNo}
                  onChange={(e) =>
                    handleAddressChange(
                      "homeAddress",
                      "houseNo",
                      e.target.value,
                    )
                  }
                  placeholder="House No."
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="homeResidency">Residency Name</label>
              <input
                type="text"
                id="homeResidency"
                value={formData.homeAddress.residencyName}
                onChange={(e) =>
                  handleAddressChange(
                    "homeAddress",
                    "residencyName",
                    e.target.value,
                  )
                }
                placeholder="Residency Name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="homeAreaCity">Area / City</label>
              <input
                type="text"
                id="homeAreaCity"
                value={formData.homeAddress.areaCity}
                onChange={(e) =>
                  handleAddressChange("homeAddress", "areaCity", e.target.value)
                }
                placeholder="Area / City"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="homeState">State</label>
                <select
                  id="homeState"
                  value={formData.homeAddress.state}
                  onChange={(e) =>
                    handleAddressChange("homeAddress", "state", e.target.value)
                  }
                  className="form-input"
                >
                  <option value="">State</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Rajasthan">Rajasthan</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="homePincode">Pincode</label>
                <input
                  type="text"
                  id="homePincode"
                  value={formData.homeAddress.pincode}
                  onChange={(e) =>
                    handleAddressChange(
                      "homeAddress",
                      "pincode",
                      e.target.value,
                    )
                  }
                  placeholder="Pincode"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Office Address */}
          <div className="form-section">
            <h3 className="section-title">Office Address</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="officeNo">Office No.</label>
                <input
                  type="text"
                  id="officeNo"
                  value={formData.officeAddress.officeNo}
                  onChange={(e) =>
                    handleAddressChange(
                      "officeAddress",
                      "officeNo",
                      e.target.value,
                    )
                  }
                  placeholder="Office No."
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="buildingNo">Building No.</label>
                <input
                  type="text"
                  id="buildingNo"
                  value={formData.officeAddress.buildingNo}
                  onChange={(e) =>
                    handleAddressChange(
                      "officeAddress",
                      "buildingNo",
                      e.target.value,
                    )
                  }
                  placeholder="Building No."
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="officeAreaCity">Area / City</label>
              <input
                type="text"
                id="officeAreaCity"
                value={formData.officeAddress.areaCity}
                onChange={(e) =>
                  handleAddressChange(
                    "officeAddress",
                    "areaCity",
                    e.target.value,
                  )
                }
                placeholder="Area / City"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="officeState">State</label>
                <select
                  id="officeState"
                  value={formData.officeAddress.state}
                  onChange={(e) =>
                    handleAddressChange(
                      "officeAddress",
                      "state",
                      e.target.value,
                    )
                  }
                  className="form-input"
                >
                  <option value="">State</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Rajasthan">Rajasthan</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="officePincode">Pincode</label>
                <input
                  type="text"
                  id="officePincode"
                  value={formData.officeAddress.pincode}
                  onChange={(e) =>
                    handleAddressChange(
                      "officeAddress",
                      "pincode",
                      e.target.value,
                    )
                  }
                  placeholder="Pincode"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="aadharNumber">Aadhar Number</label>
              <input
                type="text"
                id="aadharNumber"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                placeholder="Enter Aadhar No."
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="priceValue">Enter Price</label>
              <input
                type="number"
                id="priceValue"
                name="priceValue"
                value={formData.priceValue}
                onChange={handleInputChange}
                placeholder="Enter Price"
                className="form-input"
              />
            </div>
          </div>

          {/* Save Button */}
          <button className="save-btn" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCustomer;
