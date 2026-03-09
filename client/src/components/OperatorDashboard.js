import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const OperatorDashboard = () => {
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState('');
    const [allChildren, setAllChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '', visible: false });
    const [confirmModal, setConfirmModal] = useState({
        visible: false,
        infantId: null,
        vaccineName: '',
        dueDate: null
    });
    const role = localStorage.getItem('role');

    useEffect(() => {
        if (role !== 'operator') navigate('/');
        else fetchAllChildren();
    }, [role, navigate]);

    // --- FETCH ALL INFANTS ---
    const fetchAllChildren = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/infant/all');
            setAllChildren(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Fetch failed:", err);
            setAllChildren([]);
        } finally {
            setLoading(false);
        }
    };

    // --- SEARCH BY HEALTH ID ---
    const handleSearch = async () => {
        if (!searchId.trim()) {
            setSelectedChild(null);
            return;
        }
        try {
            const res = await API.get(`/api/infant/search/${searchId}`);
            setSelectedChild(res.data);
        } catch (err) {
            alert("Child not found with this Health ID");
            setSelectedChild(null);
        }
    };

    // --- MARK VACCINE AS DONE (Optimistic UI) ---
    const markAsDone = async (infantId, vaxName) => {
        const operatorName = localStorage.getItem('name') || "Authorized Medical Officer";
        const operatorId = localStorage.getItem('id');

        try {
            // Optimistic UI update
            setAllChildren(prev => prev.map(c => {
                if (c._id === infantId) {
                    const updatedRoadmap = c.roadmap.map(v => {
                        if (v.vaccine === vaxName) {
                            return {
                                ...v,
                                status: 'Completed',
                                administeredBy: operatorName,
                                dateAdministered: new Date()
                            };
                        }
                        return v;
                    });
                    return { ...c, roadmap: updatedRoadmap };
                }
                return c;
            }));

            if (selectedChild && selectedChild._id === infantId) {
                const updatedRoadmap = selectedChild.roadmap.map(v => {
                    if (v.vaccine === vaxName) {
                        return {
                            ...v,
                            status: 'Completed',
                            administeredBy: operatorName,
                            dateAdministered: new Date()
                        };
                    }
                    return v;
                });
                setSelectedChild({ ...selectedChild, roadmap: updatedRoadmap });
            }

            // API call
            const res = await API.put(`/api/infant/update-vaccine-status`, {
                infantId,
                vaccineName: vaxName,
                newStatus: 'Completed',
                operatorId,
                operatorName
            });

            setMessage({ text: res.data.message || `✅ ${vaxName} marked as completed`, type: 'success', visible: true });
            setTimeout(() => setMessage(prev => ({ ...prev, visible: false })), 4000);

        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Update failed";
            fetchAllChildren();
            if (selectedChild) handleSearch();
            setMessage({ text: msg, type: 'error', visible: true });
            setTimeout(() => setMessage(prev => ({ ...prev, visible: false })), 4000);
        }
    };

    // --- FORMAT DATE ---
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? "Not Scheduled" : d.toLocaleDateString();
    };

    const displayData = selectedChild ? [selectedChild] : allChildren;

    // --- OPEN CONFIRM MODAL ---
    const handleMarkClick = (childId, vaxName, dueDate) => {
        const isOverdue = dueDate && new Date(dueDate) < new Date();
        if (isOverdue) {
            setConfirmModal({
                visible: true,
                infantId: childId,
                vaccineName: vaxName,
                dueDate
            });
        } else {
            markAsDone(childId, vaxName);
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>

            {/* MESSAGE ALERT */}
            {message.visible && (
                <div style={{
                    padding: '10px 15px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    border: message.type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
                    transition: 'opacity 0.5s ease'
                }}>
                    {message.text}
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#2c3e50', margin: 0 }}>🩺 Operator Dashboard</h1>
                <button
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer' }}
                >Logout</button>
            </div>

            {/* SEARCH BAR */}
            <div style={{
                background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '30px',
                display: 'flex', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <input
                    type="text"
                    placeholder="Search Health ID (e.g. HID1234)..."
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    value={searchId}
                    onChange={e => setSearchId(e.target.value)}
                />
                <button onClick={handleSearch} style={{
                    background: '#007bff', color: 'white', padding: '0 25px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold'
                }}>Search</button>
                {selectedChild && <button onClick={() => { setSelectedChild(null); setSearchId(''); }} style={{
                    background: '#6c757d', color: 'white', padding: '0 15px', borderRadius: '8px', border: 'none', cursor: 'pointer'
                }}>Clear</button>}
            </div>

            {/* LIST */}
            <div style={{ display: 'grid', gap: '25px' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#666' }}>Loading patient records...</p>
                ) : displayData.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '40px', border: '2px dashed #ccc',
                        borderRadius: '12px', color: '#888'
                    }}>
                        No infants found in the system.
                    </div>
                ) : (
                    displayData.map(child => (
                        <div key={child._id} style={{
                            border: '1px solid #eee', padding: '25px', borderRadius: '15px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: 'white'
                        }}>
                            <div style={{ borderBottom: '2px solid #f8f9fa', paddingBottom: '15px', marginBottom: '20px' }}>
                                <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{child.name}</h2>
                                <span style={{ marginRight: '15px' }}>🆔 Health ID: <strong>{child.healthId}</strong></span>
                                <span>📅 DOB: {formatDate(child.dob)}</span>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#7f8c8d', fontSize: '14px' }}>
                                        <th style={{ padding: '12px' }}>VACCINE</th>
                                        <th>EXPECTED DATE</th>
                                        <th>STATUS</th>
                                        <th style={{ textAlign: 'right' }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(child.roadmap || []).map((vax, i) => {
                                        const vaxDate = new Date(vax.dueDate);
                                        const isOverdue = vax.status !== 'Completed' && vaxDate < new Date();
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid #fbfbfb' }}>
                                                <td style={{ padding: '15px 12px' }}><strong>{vax.vaccine}</strong></td>
                                                <td style={{ color: isOverdue ? '#e74c3c' : '#2c3e50', fontWeight: isOverdue ? 'bold' : 'normal' }}>
                                                    {formatDate(vax.dueDate)}{isOverdue && " ⚠️ OVERDUE"}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '5px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
                                                        textTransform: 'uppercase',
                                                        background: vax.status === 'Completed' ? '#d4edda' : '#fff3cd',
                                                        color: vax.status === 'Completed' ? '#155724' : '#856404'
                                                    }}>{vax.status}</span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {vax.status !== 'Completed' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMarkClick(child._id, vax.vaccine, vax.dueDate)}
                                                            style={{
                                                                background: '#27ae60',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '8px 16px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                transition: '0.2s all'
                                                            }}
                                                            onMouseOver={e => e.target.style.background = '#219150'}
                                                            onMouseOut={e => e.target.style.background = '#27ae60'}
                                                        >
                                                            Mark as Administered
                                                        </button>
                                                    ) : (
                                                        <div style={{
                                                            color: '#27ae60',
                                                            fontWeight: 'bold',
                                                            fontSize: '14px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'flex-end',
                                                            animation: 'fadeIn 0.4s forwards'
                                                        }}>
                                                            ✅ Recorded
                                                            <div style={{ fontSize: '10px', color: '#999', fontWeight: 'normal' }}>
                                                                by {vax.administeredBy || 'Staff'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>

            {/* CONFIRM MODAL */}
            {confirmModal.visible && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '12px',
                        width: '350px',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ marginBottom: '15px', color: '#e74c3c' }}>⚠️ Vaccine Overdue</h3>
                        <p style={{ marginBottom: '20px' }}>
                            The vaccine <strong>{confirmModal.vaccineName}</strong> is overdue.<br/>
                            Do you want to continue and mark it as administered?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, visible: false })}
                                style={{
                                    background: '#6c757d', color: 'white', border: 'none',
                                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'
                                }}
                            >Cancel</button>
                            <button
                                onClick={() => {
                                    markAsDone(confirmModal.infantId, confirmModal.vaccineName);
                                    setConfirmModal({ ...confirmModal, visible: false });
                                }}
                                style={{
                                    background: '#27ae60', color: 'white', border: 'none',
                                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'
                                }}
                            >Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fade-in animation */}
            <style>{`
                @keyframes fadeIn {
                    0% { opacity: 0; transform: translateY(-5px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default OperatorDashboard;