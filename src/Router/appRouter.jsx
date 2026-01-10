import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/dashboard'
import PurchaseScrap from '../dashboardPages/purchaseScrap'
import SalesRecords from '../dashboardPages/sellScrap'
import Records from '../dashboardPages/Records'

export default function AppRouter() {
    return (
        <Router>
            <Routes>
                {/* 1. Login Page (Akela Page) */}
                <Route path='/' element={<Login />} />

                {/* 2. Dashboard (Parent Route) */}
                <Route path='/dashboard' element={<Dashboard />}>
                
                    <Route path="purchase" element={<PurchaseScrap />} />
                    
                   
                    <Route path="sale" element={<SalesRecords/>} />
                    <Route path="records" element={<Records/>} />
                </Route>
            </Routes>
        </Router>
    )
}