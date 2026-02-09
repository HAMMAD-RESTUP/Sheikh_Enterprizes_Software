import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/dashboard'
import PurchaseScrap from '../dashboardPages/purchaseScrap'
import SalesRecords from '../dashboardPages/sellScrap'
import Records from '../dashboardPages/Records'
import PendingPayments from '../dashboardPages/pendingPayments'

export default function AppRouter() {
    return (
        <Router>
            <Routes>
                {/* 1. Login Page */}
                <Route path='/' element={<Login />} />

           
                <Route path='/dashboard' element={<Dashboard />} />

           
                <Route path='/purchase' element={<PurchaseScrap />} />
                <Route path='/sale' element={<SalesRecords />} />
                <Route path='/profits' element={<Records />} />
                <Route path='/salesrecords' element={<Records />} />
                <Route path='/purchaserecords' element={<Records />} />
                <Route path='/PendingPayments' element={<PendingPayments />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    )
}