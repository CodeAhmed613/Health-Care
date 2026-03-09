import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ isLoggedIn }) => {
    return (
        <div className="home-hero">
            <div className="hero-overlay">
                <div className="hero-content">
                    <span className="hero-badge">Healthcare Management System</span>
                    <h1>Digital Immunization <br/><span>Tracking for Infants</span></h1>
                    <p>Ensuring every child receives their life-saving vaccines on time. Secure, digital, and easy to manage for parents and doctors.</p>

                    {!isLoggedIn && (
                        <div className="hero-buttons">
                            <Link to="/login" className="btn-main">Login</Link>
                            <Link to="/register" className="btn-outline">Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
