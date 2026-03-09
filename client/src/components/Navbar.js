import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import API from '../api'; // 1. Import your new config

const Navbar = ({ setIsLoggedIn }) => {
    const location = useLocation(); 
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    
    const [userName, setUserName] = useState(localStorage.getItem('name') || '');

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('id');

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = useCallback(async () => {
        if (token && role === 'parent' && userId) {
            try {
                const res = await API.get(`/api/notifications/${userId}`);
                setNotifications(res.data);
            } catch (err) {
                console.error("Error fetching notifications", err);
            }
        }
    }, [token, role, userId]);

    useEffect(() => {
        const handleSync = () => {
            setUserName(localStorage.getItem('name') || '');
            // When an update event happens, fetch notifications immediately
            fetchNotifications(); 
        };

        window.addEventListener('storage', handleSync);
        window.addEventListener('nameUpdated', handleSync);
        // LISTEN FOR INBOX UPDATES
        window.addEventListener('notificationsUpdated', handleSync);
        
        handleSync();

        return () => {
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('nameUpdated', handleSync);
            window.removeEventListener('notificationsUpdated', handleSync);
        };
    }, [location, fetchNotifications]); // Added fetchNotifications to dependencies

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); 
        return () => clearInterval(interval);
    }, [fetchNotifications, location.pathname]);

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        window.location.href = '/'; 
    };

    const getLinkStyle = (path) => ({
        ...linkItemStyle,
        color: location.pathname === path ? '#007bff' : '#4a5568',
        borderBottom: location.pathname === path ? '2px solid #007bff' : 'none',
        paddingBottom: '5px'
    });

    return (
        <nav className="main-nav" style={navStyle}>
            <div className="nav-container" style={containerStyle}>
                <Link to="/" style={logoStyle}>
                    <span style={{fontSize: '1.5rem'}}>🛡️</span> HealthTrack
                </Link>

                <div className="nav-links" style={linksWrapperStyle}>
                    <Link to="/" style={getLinkStyle('/')}>Home</Link>
                    
                    {token ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                            <Link to="/roadmap" style={getLinkStyle('/roadmap')}>Roadmap</Link>

                            {role === 'parent' && (
                                <Link to="/inbox" style={{...notificationButtonStyle, color: location.pathname === '/inbox' ? '#007bff' : '#4a5568'}}>
                                    <span>Notifications 🔔</span>
                                    {unreadCount > 0 && (
                                        <span style={badgeStyle}>{unreadCount}</span>
                                    )}
                                </Link>
                            )}

                            <div style={{position: 'relative'}}>
                                <button 
                                    onClick={() => setShowDropdown(!showDropdown)} 
                                    style={userToggleStyle}
                                >
                                    Hi, <strong>{userName}</strong> ▾
                                </button>
                                
                                {showDropdown && (
                                    <div style={dropdownStyle}>
                                        <Link to="/profile" style={dropdownLinkStyle} onClick={() => setShowDropdown(false)}>👤 Profile</Link>
                                        
                                        {role === 'parent' && (
                                            <Link to="/dashboard" style={dropdownLinkStyle} onClick={() => setShowDropdown(false)}>📊 My Dashboard</Link>
                                        )}
                                        
                                        {role === 'admin' && <Link to="/admin" style={dropdownLinkStyle} onClick={() => setShowDropdown(false)}>⚙️ Admin Panel</Link>}
                                        {role === 'operator' && <Link to="/operator-dashboard" style={dropdownLinkStyle} onClick={() => setShowDropdown(false)}>👨‍⚕️ Operator Panel</Link>}

                                        <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />
                                        <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Link to="/login" style={linkItemStyle}>Login</Link>
                            <Link to="/register" style={signUpButtonStyle}>Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

const navStyle = { position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e0e0e0', padding: '10px 0', height: '70px', display: 'flex', alignItems: 'center' };
const containerStyle = { width: '90%', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const logoStyle = { textDecoration: 'none', color: '#1a2a3a', fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' };
const linksWrapperStyle = { display: 'flex', alignItems: 'center', gap: '25px' };
const linkItemStyle = { textDecoration: 'none', color: '#4a5568', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s ease' };
const signUpButtonStyle = { backgroundColor: '#007bff', color: 'white', padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(0, 123, 255, 0.2)' };
const notificationButtonStyle = { position: 'relative', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' };
const badgeStyle = { position: 'absolute', top: '-10px', right: '-12px', background: '#e53e3e', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold', border: '2px solid white' };
const userToggleStyle = { background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', color: '#1e293b', fontWeight: '500' };
const dropdownStyle = { position: 'absolute', top: '50px', right: 0, backgroundColor: 'white', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', borderRadius: '12px', padding: '10px', minWidth: '200px', display: 'flex', flexDirection: 'column', border: '1px solid #f1f5f9' };
const dropdownLinkStyle = { padding: '12px', textDecoration: 'none', color: '#334155', fontSize: '0.9rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' };
const logoutButtonStyle = { padding: '12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', width: '100%' };

export default Navbar;