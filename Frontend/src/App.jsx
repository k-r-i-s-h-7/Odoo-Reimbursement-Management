import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import SigninPage from './pages/SigninPage'
import SignupPage from './pages/SignupPage'

const App = () => {
	return <SignupPage />
}

export default App;