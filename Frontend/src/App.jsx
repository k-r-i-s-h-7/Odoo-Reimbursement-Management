import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import SigninPage from './pages/SigninPage'
import SignupPage from './pages/SignupPage'
import ManagerDashboard from './pages/ManagerDashboard'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signin" element={<SigninPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        
        {/* 2. ADD THIS LINE HERE - Inside the Routes block */}
        <Route path="/manager" element={<ManagerDashboard />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App