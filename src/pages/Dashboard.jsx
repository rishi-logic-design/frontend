import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./dashboard.scss";
import AnimatedOutlet from "../components/AnimatedOutlet";

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <AnimatedOutlet />
      </div>
    </div>
  );
};

export default Dashboard;
