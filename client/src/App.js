import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Admin from './pages/Admin';
import ManageSchedule from './pages/ManageSchedule';
import Home from './pages/Home';
import Notifications from './pages/Notifications';
import NotificationInbox from './components/NotificationInbox';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Roadmap from './components/Roadmap';
import OperatorDashboard from './components/OperatorDashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Keep track of login status across refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    if (token) {
      document.body.classList.add('logged-in');
    } else {
      document.body.classList.remove('logged-in');
    }
  }, []);

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar setIsLoggedIn={setIsLoggedIn} /> {/* Pass setter to Navbar for logout */}
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
        {/* <Route path="/admindashboard" element={<AdminDashboard />} /> */}           
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/inbox" element={<NotificationInbox />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/operator-dashboard" element={<OperatorDashboard />} />
            <Route path="/manage-schedule" element={<ManageSchedule />} /> 
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/notifications" element={<Notifications />} />

          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
