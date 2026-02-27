import React from "react";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiShield,
  FiHeart,
  FiCode,
  FiZap,
  FiGithub,
  FiTwitter,
  FiGlobe,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./aboutPage.scss";

const AboutPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const features = [
    {
      icon: <FiZap />,
      title: "Lightning Fast",
      desc: "Experience zero lag with our optimized ERP engine built for high-performance accounting.",
    },
    {
      icon: <FiShield />,
      title: "Secure by Design",
      desc: "Your financial data is encrypted and protected with industry-standard security protocols.",
    },
    {
      icon: <FiHeart />,
      title: "User Centric",
      desc: "Designed for business owners, not just accountants. Simple, intuitive, and powerful.",
    },
    {
      icon: <FiCode />,
      title: "Modern Stack",
      desc: "Built with React and Node.js to ensure a scalable and maintainable business platform.",
    },
  ];

  return (
    <motion.div
      className="about-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="about-header">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <div className="about-content">
        <motion.div className="hero-section" variants={itemVariants}>
          <div className="logo-box">
            <div className="logo-inner">A</div>
          </div>
          <h1 className="app-name">
            Auditra <span className="version">v2.1.0</span>
          </h1>
          <p className="tagline">
            Next-Gen Business Accounting & Inventory Management
          </p>
        </motion.div>

        <motion.div className="mission-card" variants={itemVariants}>
          <h3>Our Mission</h3>
          <p>
            Auditra was built with a single goal: To empower small and medium
            businesses with professional-grade financial tools that are
            incredibly easy to use. We believe that managing your business
            should be as enjoyable as growing it.
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="feature-card"
              variants={itemVariants}
            >
              <div className="feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div className="footer-links" variants={itemVariants}>
          <div className="social-links">
            <FiGlobe /> <FiGithub /> <FiTwitter />
          </div>
          <p className="copyright">
            © 2026 Auditra Technologies. All rights reserved.
          </p>
          <div className="legal">
            <span>Privacy Policy</span> • <span>Terms of Service</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AboutPage;
