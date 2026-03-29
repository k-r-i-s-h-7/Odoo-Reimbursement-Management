import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ManagerDashboard from './pages/ManagerDashboard'; // We'll create this folder/file next

const App = () => {
  return (
    <Router>
      <nav style={{ padding: '10px', background: '#1e1e1e', borderBottom: '1px solid #333' }}>
        {/* Hackathon Navigation - Helps you jump to your part easily */}
        <Link to="/manager" style={{ color: '#4da6ff', textDecoration: 'none' }}>Manager Dashboard</Link>
      </nav>

      <Routes>
  {/* Making your work the default home page */}
  <Route path="/" element={<ManagerDashboard />} /> 
  <Route path="/manager" element={<ManagerDashboard />} />
  </Routes>
    </Router>
  );
}

export default App;