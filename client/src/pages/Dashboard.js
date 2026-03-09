import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import API from '../api'; 

const Dashboard = () => {
    // --- STATE MANAGEMENT ---
    const [infants, setInfants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newInfant, setNewInfant] = useState({ name: '', dob: '', healthId: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', healthId: '' });
    
    // Notification & Inbox States
    const [notifications, setNotifications] = useState([]);
    const [replyText, setReplyText] = useState("");
    const [activeReplyId, setActiveReplyId] = useState(null);

    const parentId = localStorage.getItem('id'); 
    const parentName = localStorage.getItem('name');

    // --- EFFECT HOOKS ---
    useEffect(() => {
        if (parentId) {
            fetchInfants();
            fetchNotifications();
        }
    }, [parentId]);

    // --- DATA FETCHING ---
    const fetchInfants = async () => {
        try {
            const res = await API.get(`/api/infant/my-children/${parentId}`);
            setInfants(res.data);
        } catch (err) {
            console.error("Error fetching infants");
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await API.get(`/api/notifications/${parentId}`);
            setNotifications(res.data);
        } catch (err) {
            console.error("Error fetching notifications");
        }
    };

    // --- ACTION HANDLERS ---
    const handleAddChild = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/api/infant/add', { ...newInfant, parentId });
            setInfants([...infants, res.data]);
            setNewInfant({ name: '', dob: '', healthId: '' });
            alert("Additional child registered!");
        } catch (err) { alert("Registration failed"); }
    };

    const handleUpdateProfile = async (id) => {
        try {
            await API.put(`/api/infant/update-info`, { infantId: id, ...editForm });
            setEditingId(null);
            fetchInfants(); 
        } catch (err) { alert("Update failed"); }
    };

const handleSendReply = async (originalMsg) => {
    if (!replyText.trim()) return alert("Please type a message.");
    try {
        // REMOVE the '/api' prefix here because your server.js 
        // already adds it via app.use('/api/notifications', ...)
        await API.post('/api/notifications/reply', {
            message: replyText,
            senderId: parentId,
            senderName: parentName,
            originalMessageId: originalMsg._id
        });
        alert("Reply sent to Admin!");
        setReplyText("");
        setActiveReplyId(null);
    } catch (err) {
        console.error("Error details:", err.response); // This will show the real error in Console
        alert("Failed to send reply. Check console for details.");
    }
};

    // --- PDF GENERATION LOGIC ---
    const downloadPDF = async (child) => {
        try {
            const doc = new jsPDF();
            const safeName = String(child.name ?? "Unknown Child");
            const safeHealthId = String(child.healthId ?? "N/A");
            const safeDob = child.dob ? new Date(child.dob).toLocaleDateString() : "N/A";

            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.setTextColor(44, 62, 80);
            doc.text("OFFICIAL VACCINATION RECORD", 105, 20, { align: "center" });

            const qrData = `Child: ${safeName} | HID: ${safeHealthId}`;
            const qrCodeDataUri = await QRCode.toDataURL(qrData);
            doc.addImage(qrCodeDataUri, 'PNG', 160, 28, 30, 30);

            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Child Name: ${safeName}`, 14, 35);
            doc.text(`Health ID: ${safeHealthId}`, 14, 42);
            doc.text(`Date of Birth: ${safeDob}`, 14, 49);

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
                headStyles: { fillColor: [44, 62, 80] },
                styles: { fontSize: 9 }
            });

            const finalY = (doc.lastAutoTable?.finalY ?? 150) + 40;
            doc.setDrawColor(180, 0, 0); 
            doc.circle(35, finalY - 5, 15); 
            doc.setFontSize(7);
            doc.setTextColor(180, 0, 0);
            doc.text("MINISTRY OF HEALTH", 35, finalY - 10, { align: "center" });
            doc.text("OFFICIAL SEAL", 35, finalY - 4, { align: "center" });

            const completedVax = (child.roadmap ?? []).filter(v => v.status === 'Completed');
            const signerName = completedVax.length > 0 
                ? String(completedVax[completedVax.length - 1].administeredBy) 
                : "Medical Officer";

            doc.setDrawColor(0);
            doc.line(145, finalY, 195, finalY);
            doc.setFont("times", "italic");
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 128); 
            doc.text(signerName, 170, finalY - 5, { align: "center" });
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text("Original Administering Doctor", 170, finalY + 5, { align: "center" });

            doc.save(`${safeName}_Vaccination_Record.pdf`);
        } catch (err) {
            console.error("PDF Error:", err);
            alert("Error generating PDF.");
        }
    };

    if (loading) return <div style={centerStyle}>Loading Family Records...</div>;

    return (
        <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
            {/* Header */}
            <div style={welcomeCard}>
                <h1>Welcome, {parentName}</h1>
                <p>Manage your children's immunization schedules and messages from the clinic.</p>
            </div>

            {/* --- INBOX SECTION --- */}
            <div style={inboxCard}>
                <h3>📩 Inbox & Admin Alerts</h3>
                {notifications.length === 0 ? (
                    <p style={subText}>No messages from admin at this time.</p>
                ) : (
                    notifications.map((msg) => (
                        <div key={msg._id} style={msgItem}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={typeBadge}>{msg.type.replace('_', ' ').toUpperCase()}</span>
                                <small style={{ color: '#888' }}>{new Date(msg.createdAt).toLocaleDateString()}</small>
                            </div>
                            <p style={{ margin: '10px 0', fontSize: '1rem' }}>{msg.message}</p>
                            
                            <button 
                                style={editLink} 
                                onClick={() => setActiveReplyId(activeReplyId === msg._id ? null : msg._id)}
                            >
                                {activeReplyId === msg._id ? 'Close' : 'Reply to Admin'}
                            </button>

                            {activeReplyId === msg._id && (
                                <div style={{ marginTop: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                                    <textarea 
                                        style={{...inputStyle, width: '100%', minHeight: '80px', marginBottom: '10px'}} 
                                        placeholder="Type your response to the administrator..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <button style={addBtn} onClick={() => handleSendReply(msg)}>Send Response</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            

            {/* Registration Form */}
            <div style={formCard}>
                <h3>👶 Add Another Child</h3>
                <form onSubmit={handleAddChild} style={formGrid}>
                    <input style={inputStyle} type="text" placeholder="Name" value={newInfant.name} onChange={e => setNewInfant({...newInfant, name: e.target.value})} required />
                    <input style={inputStyle} type="date" value={newInfant.dob} onChange={e => setNewInfant({...newInfant, dob: e.target.value})} required />
                    <input style={inputStyle} type="text" placeholder="Health ID" value={newInfant.healthId} onChange={e => setNewInfant({...newInfant, healthId: e.target.value})} required />
                    <button type="submit" style={addBtn}>Add Infant</button>
                </form>
            </div>

            {/* Infants List */}
            {infants.length === 0 ? (
                <div style={emptyState}>No infants found. Use the form above to register.</div>
            ) : (
                infants.map((infant) => (
                    <div key={infant._id} style={infantCard}>
                        <div style={cardHeader}>
                            {editingId === infant._id ? (
                                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                                    <input style={inputStyle} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                                    <input style={inputStyle} value={editForm.healthId} onChange={e => setEditForm({...editForm, healthId: e.target.value})} />
                                    <button style={saveBtn} onClick={() => handleUpdateProfile(infant._id)}>Save</button>
                                </div>
                            ) : (
                                <>
                                    <h3>👶 {infant.name}</h3>
                                    <div style={{display: 'flex', gap: '15px'}}>
                                        <button style={pdfBtn} onClick={() => downloadPDF(infant)}>📥 PDF</button>
                                        <button style={editLink} onClick={() => { setEditingId(infant._id); setEditForm({name: infant.name, healthId: infant.healthId}) }}>Edit</button>
                                    </div >
                                </>
                            )}
                        </div>
                        <p style={subText}>Health ID: <strong>{infant.healthId}</strong> | DOB: <strong>{new Date(infant.dob).toLocaleDateString()}</strong></p>

                        <h4 style={{marginTop: '20px'}}>Vaccination Roadmap</h4>
                        <div className="table-scroll-area">
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={tableHead}>
                                        <th style={cell}>Vaccine</th>
                                        <th style={cell}>Due Date</th>
                                        <th style={cell}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {infant.roadmap.map((v, i) => (
                                        <tr key={i} style={tableRow}>
                                            <td style={cell}><strong>{v.vaccine}</strong></td>
                                            <td style={cell}>{new Date(v.dueDate).toLocaleDateString()}</td>
                                            <td style={cell}><span style={badgeStyle(v.status)}>{v.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// --- STYLES ---
const welcomeCard = { background: '#007bff', color: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px' };
const inboxCard = { background: 'white', padding: '25px', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderLeft: '6px solid #28a745' };
const msgItem = { padding: '15px 0', borderBottom: '1px solid #f0f0f0' };
const typeBadge = { background: '#e3f2fd', color: '#007bff', padding: '4px 8px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 'bold' };
const formCard = { background: '#f8f9fa', padding: '25px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #e9ecef' };
const formGrid = { display: 'flex', gap: '15px', flexWrap: 'wrap' };
const infantCard = { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '30px', borderLeft: '6px solid #007bff' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' };
const addBtn = { background: '#28a745', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const pdfBtn = { background: '#2c3e50', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' };
const saveBtn = { background: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px' };
const editLink = { color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 };
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px' };
const tableHead = { textAlign: 'left', background: '#f8f9fa', color: '#666' };
const tableRow = { borderBottom: '1px solid #eee' };
const cell = { padding: '15px' };
const subText = { color: '#666', fontSize: '0.95rem' };
const centerStyle = { textAlign: 'center', marginTop: '50px' };
const emptyState = { textAlign: 'center', padding: '50px', color: '#888', background: '#fff', borderRadius: '15px' };
const badgeStyle = (s) => ({
    padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
    background: s === 'Completed' ? '#d4edda' : (s === 'Overdue' ? '#f8d7da' : '#e3f2fd'),
    color: s === 'Completed' ? '#155724' : (s === 'Overdue' ? '#721c24' : '#004085')
});

export default Dashboard;