import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import API from '../api'; // 1. Import your new config

const Roadmap = () => {
    const [infants, setInfants] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('id');

    useEffect(() => {
        const fetchRoadmaps = async () => {
            try {
                const res = await API.get(`/api/infant/my-children/${userId}`);
                setInfants(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching roadmaps", err);
                setLoading(false);
            }
        };
        if (userId) fetchRoadmaps();
    }, [userId]);

    // --- PDF GENERATION LOGIC (CRASH-PROOF VERSION) ---
    const downloadPDF = async (child) => {
        try {
            const doc = new jsPDF();

            // 1. SAFE DATA EXTRACTION (Prevents "Invalid arguments" error)
            const safeName = String(child.name ?? "Unknown Child");
            const safeHealthId = String(child.healthId ?? "N/A");
            const safeDob = child.dob ? new Date(child.dob).toLocaleDateString() : "N/A";

            // 2. HEADER & QR CODE
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(44, 62, 80);
            doc.text("OFFICIAL VACCINATION RECORD", 105, 20, { align: "center" });

            const qrData = `Child: ${safeName} | Health ID: ${safeHealthId}`;
            const qrCodeDataUri = await QRCode.toDataURL(qrData);
            doc.addImage(qrCodeDataUri, 'PNG', 160, 28, 30, 30);

            // 3. CHILD BIODATA
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Child Name: ${safeName}`, 14, 35);
            doc.text(`Health ID: ${safeHealthId}`, 14, 42);
            doc.text(`Date of Birth: ${safeDob}`, 14, 49);
            doc.text(`Certificate Issue Date: ${new Date().toLocaleDateString()}`, 14, 56);

            // 4. THE TABLE
            const tableRows = (child.roadmap ?? []).map(v => [
                String(v.vaccine ?? "Vaccine"),
                v.dueDate ? new Date(v.dueDate).toLocaleDateString() : "---",
                String(v.status ?? "Upcoming").toUpperCase(),
                String(v.administeredBy ?? "---") 
            ]);

            autoTable(doc, {
                startY: 65,
                head: [['Vaccine Name', 'Scheduled Date', 'Status', 'Administered By']],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [44, 62, 80], halign: 'center' },
                styles: { fontSize: 9 },
                didDrawCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        if (data.cell.raw === 'COMPLETED') doc.setTextColor(46, 125, 50);
                    }
                }
            });

            // 5. SIGNATURE & STAMPS SECTION
            const finalY = (doc.lastAutoTable?.finalY ?? 150) + 40;

            // A. MINISTRY OF HEALTH SEAL
            doc.setDrawColor(180, 0, 0); 
            doc.setLineWidth(0.8);
            doc.circle(35, finalY - 5, 15); 
            doc.setFontSize(5);
            doc.setTextColor(180, 0, 0);
            doc.text("MINISTRY OF HEALTH", 35, finalY - 10, { align: "center" });
            doc.setFontSize(7);
            doc.text("OFFICIAL SEAL", 35, finalY - 4, { align: "center" });

            // B. HEALTHTRACK SYSTEM STAMP
            doc.setDrawColor(0, 102, 204); 
            doc.rect(75, finalY - 20, 50, 22, 'D'); 
            doc.setFontSize(9);
            doc.setTextColor(0, 102, 204);
            doc.text("HealthTrack™", 100, finalY - 12, { align: "center" });
            doc.setFontSize(7);
            doc.text("SYSTEM AUTHORIZED", 100, finalY - 7, { align: "center" });

            // C. DYNAMIC DOCTOR SIGNATURE
            const completedList = (child.roadmap ?? []).filter(v => v.status === 'Completed' || v.status === 'COMPLETED');
            const originalDoctor = completedList.length > 0 
                ? String(completedList[completedList.length - 1].administeredBy ?? "Medical Officer") 
                : "Medical Officer";

            doc.setDrawColor(0);
            doc.line(145, finalY, 195, finalY);
            doc.setFont("times", "italic");
            doc.setFontSize(15);
            doc.setTextColor(0, 0, 128); 
            doc.text(originalDoctor, 170, finalY - 5, { align: "center" });
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text("Original Administering Doctor", 170, finalY + 5, { align: "center" });

            doc.save(`${safeName}_Vaccination_Record.pdf`);
        } catch (err) {
            console.error("PDF Generation failed", err);
            alert("Error generating PDF. Please ensure child data is fully loaded.");
        }
    };

    if (loading) return <div className="admin-container">Loading Records...</div>;

    return (
        <div className="admin-container" style={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#2c3e50' }}>Family Immunization Tracker</h1>
            
            {infants.map((child) => {
                const completed = child.roadmap.filter(v => v.status === 'Completed');
                const upcoming = child.roadmap.filter(v => v.status !== 'Completed');

                return (
                    <div key={child._id} className="management-card" style={childCard}>
                        <div style={header}>
                            <div>
                                <h2 style={{ margin: 0 }}>👶 {child.name}</h2>
                                <p style={{ color: '#666', margin: '5px 0' }}>Health ID: {child.healthId}</p>
                            </div>
                            <button onClick={() => downloadPDF(child)} style={downloadBtn}>
                                📥 Download Verified PDF
                            </button>
                        </div>

                        <div style={twoColumnLayout}>
                            <div style={column}>
                                <h3 style={sectionTitle}>✅ Vaccinated History</h3>
                                {completed.length === 0 ? <p style={emptyText}>No history found.</p> : 
                                    completed.map((v, i) => (
                                        <div key={i} style={historyCard}>
                                            <strong>{v.vaccine}</strong>
                                            <span>Given: {new Date(v.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    ))
                                }
                            </div>

                            <div style={column}>
                                <h3 style={sectionTitle}>🗓️ Upcoming Roadmap</h3>
                                {upcoming.length === 0 ? <p style={emptyText}>Schedule complete!</p> : 
                                    upcoming.map((v, i) => (
                                        <div key={i} style={{ ...roadmapCard, borderLeftColor: v.status === 'Overdue' ? '#F44336' : '#2196F3' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <strong>{v.vaccine}</strong>
                                                <span style={badgeStyle(v.status)}>{v.status}</span>
                                            </div>
                                            <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>Due: {new Date(v.dueDate).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- STYLES ---
const downloadBtn = { background: '#2c3e50', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const childCard = { background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: '50px' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '20px' };
const twoColumnLayout = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' };
const column = { minWidth: '0' };
const sectionTitle = { fontSize: '18px', marginBottom: '15px', color: '#444' };
const historyCard = { display: 'flex', justifyContent: 'space-between', background: '#f0fdf4', padding: '12px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #dcfce7' };
const roadmapCard = { background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #eee', borderLeftWidth: '6px' };
const emptyText = { color: '#999', fontSize: '14px', fontStyle: 'italic' };
const badgeStyle = (status) => ({ fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '10px', background: status === 'Overdue' ? '#ffebee' : '#e3f2fd', color: status === 'Overdue' ? '#c62828' : '#1565c0' });

export default Roadmap;