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
                    
                    {/* Index ka matlab hai jab sirf /dashboard khule toh kya dikhe */}
                    {/* Aap yahan apna Overview wala content dikha sakte hain */}
                    <Route index element={<div className="text-white p-10">Welcome to Overview</div>} />

                    {/* 3. Nested Route: /dashboard/purchase */}
                    {/* Yahan path mein dobara /dashboard likhne ki zaroorat nahi hoti */}
                    <Route path="purchase" element={<PurchaseScrap />} />
                    
                    {/* Aap mazeed routes yahan add kar sakte hain */}
                    <Route path="sale" element={<SalesRecords/>} />
                    <Route path="records" element={<Records/>} />
                </Route>
            </Routes>
        </Router>
    )
}