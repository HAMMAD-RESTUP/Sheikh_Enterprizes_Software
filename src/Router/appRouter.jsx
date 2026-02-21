import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/dashboard";

import PurchaseScrap from "../dashboardPages/purchaseScrap";
import SellScrap from "../dashboardPages/sellScrap";
import Profits from "../dashboardPages/profits";

import PendingPayments from "../dashboardPages/pendingPayments";
import PendingView from "../dashboardPages/viewpendingPayments";
import PendingEdit from "../dashboardPages/editpendingPayments";

import SellerRecords from "../dashboardPages/sellerRecords";
import PurchaserRecords from "../dashboardPages/purchaserRecords";

import SellerView from "../dashboardPages/viewsellerRecords"
import SellerEdit from "../dashboardPages/editsellerrecords"
import PurchaseView from "../dashboardPages/viewpurchaserRecords"
import PurchaseEdit from "../dashboardPages/editpurchaserRecords"

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/purchase" element={<PurchaseScrap />} />
        <Route path="/sell" element={<SellScrap />} />
        <Route path="/profits" element={<Profits />} />

        <Route path="/sellerrecords" element={<SellerRecords />} />
        <Route path="/sellerrecords/view/:id" element={<SellerView />} />
        <Route path="/sellerrecords/edit/:id" element={<SellerEdit />} />


        <Route path="/purchaserecords" element={<PurchaserRecords />} />
        <Route path="/purchaserecords/view/:id" element={<PurchaseView />} />
        <Route path="/purchaserecords/edit/:id" element={<PurchaseEdit />} />

        <Route path="/pendingpayments" element={<PendingPayments />} />
        <Route path="/pendingpayments/view/:id" element={<PendingView />} />
        <Route path="/pendingpayments/edit/:id" element={<PendingEdit />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}