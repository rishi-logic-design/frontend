import React, { useState } from "react";
import "./eWayBill.scss";
import { FiEye, FiEyeOff, FiPhone } from "react-icons/fi";
import { RiWhatsappFill } from "react-icons/ri";

const EWayBill = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    gstin: "",
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("E-Waybill Login Attempt:", formData);
  };

  return (
    <div className="ewaybill-container">
      <div className="login-card">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png"
          alt="Government of India"
          className="gov-emblem"
        />

        <h1 className="card-title">E-Waybill System Login</h1>

        <form className="ewaybill-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>GSTIN</label>
            <div className="input-wrapper">
              <input
                type="text"
                name="gstin"
                placeholder="Enter GSTIN"
                value={formData.gstin}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                name="username"
                placeholder="Enter Username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <div className="login-footer">
          <div className="footer-icon">
            <FiPhone className="phone" />
            <RiWhatsappFill className="whatsapp" />
          </div>
          <span>Call / WhatsApp us: 8770717151</span>
        </div>
      </div>
    </div>
  );
};

export default EWayBill;
