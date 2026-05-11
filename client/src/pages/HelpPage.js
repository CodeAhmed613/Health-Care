import React, { useState } from "react";
import "./HelpPage.css";

function HelpPage() {
  const [activeTab, setActiveTab] = useState("faq");

  return (
    <div className="help-container">
      
      <div className="help-sidebar">
        <h3>Help Center</h3>

        <button onClick={() => setActiveTab("faq")}>FAQs</button>
        <button onClick={() => setActiveTab("policies")}>Policies</button>
        <button onClick={() => setActiveTab("terms")}>Terms & Conditions</button>
      </div>

      <div className="help-content">

        {activeTab === "faq" && (
          <div>
            <h2>Frequently Asked Questions</h2>

            <h4>How do I register my infant?</h4>
            <p>
              Parents can register their infant by creating an account and filling
              the infant registration form with the child's details.
            </p>

            <h4>How do I know when my child needs a vaccine?</h4>
            <p>
              The system automatically generates an immunization schedule and
              sends reminders before the due date.
            </p>

            <h4>Can I update my information?</h4>
            <p>
              Yes. Parents can update their contact information in the profile
              section.
            </p>

          </div>
        )}

        {activeTab === "policies" && (
          <div>
            <h2>System Policies</h2>

            <p>
              This system is designed to support infant immunization tracking
              and ensure timely vaccination.
            </p>

            <h4>Data Privacy Policy</h4>
            <p>
              Personal data such as parent information and infant health data
              are stored securely and used only for vaccination management.
            </p>

            <h4>Access Policy</h4>
            <p>
              Only authorized health workers and registered parents can access
              vaccination records.
            </p>

          </div>
        )}

        {activeTab === "terms" && (
          <div>
            <h2>Terms and Conditions</h2>

            <p>
              By using the Infant Immunization System, users agree to the
              following terms:
            </p>

            <ul>
              <li>Users must provide accurate information.</li>
              <li>Parents are responsible for keeping their login credentials secure.</li>
              <li>The system provides vaccination reminders but does not replace medical advice.</li>
              <li>Health workers must ensure vaccination records are accurate.</li>
            </ul>

          </div>
        )}

      </div>
    </div>
  );
}

export default HelpPage;