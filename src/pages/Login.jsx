import React, { useState } from "react";
import axios from "axios";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";
import "./login.scss";

const API_URL =
  import.meta.env.VITE_API_URL || "https://accountsoft.onrender.com";

const Login = () => {
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("enterPhone");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState(null);

  const checkVendor = async () => {
    setMessage({ text: "", type: "" });

    if (!/^[0-9]{10}$/.test(mobile)) {
      setMessage({
        text: "Please enter a valid 10-digit mobile number",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/auth/vendor/check`, {
        mobile,
      });

      if (data.success) {
        setVendorData(data.data.vendor);
        setMessage({ text: data.message, type: "success" });
        setTimeout(() => sendOtp(), 800);
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Vendor not found",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const sendOtp = async () => {
    setMessage({ text: "", type: "" });

    if (!/^[0-9]{10}$/.test(mobile)) {
      setMessage({
        text: "Please enter valid 10-digit mobile number",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Cleanup existing reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      // Initialize reCAPTCHA
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" },
      );

      // Send OTP
      const result = await signInWithPhoneNumber(
        auth,
        `+91${mobile}`,
        window.recaptchaVerifier,
      );
      setConfirmationResult(result);
      setStep("enterOtp");
      setMessage({ text: "OTP sent successfully", type: "success" });
    } catch (error) {
      console.error("OTP send error:", error);

      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      setMessage({
        text: error.message || "Failed to send OTP",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    setMessage({ text: "", type: "" });
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setMessage({ text: "Please enter complete 6-digit OTP", type: "error" });
      return;
    }

    if (!confirmationResult) {
      setMessage({ text: "Please request OTP first", type: "error" });
      return;
    }

    setLoading(true);
    try {
      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(otpValue);

      // Exchange token with backend
      const { data } = await axios.post(
        `${API_URL}/auth/vendor/exchange-firebase-token`,
        {
          mobile,
          firebaseUid: result.user.uid,
        },
      );

      if (data.success) {
        localStorage.setItem("vendorToken", data.data.token);
        localStorage.setItem("vendorData", JSON.stringify(data.data.vendor));
        setMessage({ text: "Login successful!", type: "success" });
        setTimeout(() => (window.location.href = "/vendor/dashboard"), 500);
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      setMessage({
        text:
          error.response?.data?.message ||
          error.message ||
          "Verification failed",
        type: "error",
      });
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Handlers
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^[0-9]+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length - 1, 5);
    document.getElementById(`otp-${lastIndex}`)?.focus();
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtp(["", "", "", "", "", ""]);
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    await sendOtp();
  };

  // Change Number
  const handleChangeNumber = () => {
    setStep("enterPhone");
    setOtp(["", "", "", "", "", ""]);
    setMessage({ text: "", type: "" });
    setVendorData(null);

    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  // Message Icon Component
  const MessageIcon = ({ type }) => {
    const icons = {
      success: "M20 6L9 17l-5-5",
      info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
      error:
        "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    };

    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d={icons[type] || icons.info} />
      </svg>
    );
  };

  return (
    <div className="login-page">
      <div id="recaptcha-container"></div>

      <div className="login-left">
        <div className="login-container">
          {/* Logo Section */}
          <div className="logo-section">
            <div className="logo">
              <div className="logo-bars">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className="bar"></span>
                ))}
              </div>
              <span className="logo-text">Auditra</span>
            </div>
            <h1 className="title">
              {step === "enterPhone"
                ? "Welcome Back, Vendor"
                : "Verify Your Identity"}
            </h1>
            <p className="subtitle">
              {step === "enterPhone"
                ? "Enter your registered mobile number"
                : "Enter the 6-digit code sent to your phone"}
            </p>
          </div>

          {/* Vendor Info Card */}
          {vendorData && step === "enterOtp" && (
            <div className="vendor-info">
              <div className="info-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="info-content">
                <h3>{vendorData.vendorName}</h3>
                <p>{vendorData.businessName}</p>
                <span>{vendorData.mobile}</span>
              </div>
            </div>
          )}

          {/* Phone Input */}
          {step === "enterPhone" && (
            <div className="form-section">
              <div className="input-group">
                <label className="input-label">Mobile Number</label>
                <div className="phone-input-wrapper">
                  <span className="country-code">+91</span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="Enter 10-digit number"
                    className="input-field"
                    maxLength={10}
                    onKeyPress={(e) =>
                      e.key === "Enter" && mobile.length === 10 && checkVendor()
                    }
                  />
                  <div className="input-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                </div>
              </div>

              {message.text && (
                <div className={`message ${message.type}`}>
                  <div className="message-icon">
                    <MessageIcon type={message.type} />
                  </div>
                  <span>{message.text}</span>
                </div>
              )}

              <button
                className="btn-primary"
                onClick={checkVendor}
                disabled={loading || mobile.length !== 10}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          )}

          {/* OTP Input */}
          {step === "enterOtp" && (
            <div className="form-section">
              <div className="otp-section">
                <label className="input-label">Verification Code</label>
                <div className="otp-boxes" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={1}
                      className="otp-box"
                    />
                  ))}
                </div>
              </div>

              {message.text && (
                <div className={`message ${message.type}`}>
                  <div className="message-icon">
                    <MessageIcon type={message.type} />
                  </div>
                  <span>{message.text}</span>
                </div>
              )}

              <button
                className="btn-primary"
                onClick={verifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </button>

              <div className="otp-actions">
                <button
                  className="action-btn"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                  </svg>
                  Resend OTP
                </button>
                <button className="action-btn" onClick={handleChangeNumber}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Change Number
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="login-right">
        <div className="illustration">
          <div className="floating-card card-1">
            <div className="card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p>Secure Login</p>
          </div>

          <div className="floating-card card-2">
            <div className="card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p>Protected Data</p>
          </div>

          <div className="central-graphic">
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="screen-lock">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="screen-dots">
                  {[...Array(3)].map((_, i) => (
                    <span key={i} className="dot"></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
