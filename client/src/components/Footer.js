import React from 'react';

const Footer = () => {
    return (
        <footer className="main-footer" style={{backgroundColor: '#1a2a3a', color: '#f8f9fa', padding: '40px 20px 20px'}}>
            <div className="footer-content" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto'}}>
                <div className="footer-section">
                    <h4 style={{color: '#4dabf7'}}>🏢 Official Partner</h4>
                    <p style={{fontSize: '0.9rem', lineHeight: '1.6'}}>
                        In collaboration with the <strong>Ministry of Health (MoH)</strong>. 
                        Dedicated to achieving 100% national immunization coverage.
                    </p>
                </div>
                <div className="footer-section">
                    <h4>Resources</h4>
                    <ul style={{listStyle: 'none', padding: 0}}>
                        <li><a href="https://www.who.int" target="_blank" rel="noreferrer" style={footerLink}>WHO Guidelines</a></li>
                        <li><a href="https://www.moh.gov.et" target="_blank" rel="noreferrer" style={footerLink}>Ministry Portal</a></li>
                        <li><a href="/roadmap" style={footerLink}>Vaccine Schedules</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Health Support</h4>
                    <p style={{marginBottom: '5px'}}>📞 Emergency: 911</p>
                    <p>📧 Official: <a href="mailto:contact@moh.gov.et" style={{color: '#4dabf7'}}>contact@moh.gov.et</a></p>
                </div>
            </div>
            
            <hr style={{margin: '30px 0', borderColor: 'rgba(255,255,255,0.1)'}} />
            
            <div className="footer-bottom" style={{textAlign: 'center', fontSize: '0.8rem', opacity: 0.7}}>
                <p>&copy; {new Date().getFullYear()} Infant Immunization System | Secure Government Cloud Infrastructure</p>
            </div>
        </footer>
    );
};

const footerLink = {
    color: '#adb5bd',
    textDecoration: 'none',
    fontSize: '0.9rem',
    display: 'block',
    marginBottom: '8px',
    transition: 'color 0.2s'
};

export default Footer;