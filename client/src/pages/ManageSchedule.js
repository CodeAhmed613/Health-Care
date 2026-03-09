import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../api'; // 1. Import your new config

const ManageSchedule = () => {
    const [sessions, setSessions] = useState([]);
    const [formData, setFormData] = useState({
        clinicName: '',
        vaccineType: '',
        sessionDate: '',
        availableSlots: 0
    });

    // 1. Fetch all sessions on load
    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        const res = await API.get('/api/admin/sessions');
        setSessions(res.data);
    };

    // 2. Create new session
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/api/admin/session', formData);
            alert("New Vaccination Session Published!");
            setFormData({ clinicName: '', vaccineType: '', sessionDate: '', availableSlots: 0 }); // Reset
            fetchSessions(); // Refresh list
        } catch (err) {
            alert("Error creating session");
        }
    };

    // 3. Delete session
    const handleDelete = async (id) => {
        if (window.confirm("Cancel this vaccination session? Parents will be notified.")) {
            await API.delete(`/api/admin/session/${id}`);
            fetchSessions();
        }
    };

    return (
        <div className="admin-container">
            <h1>Clinic Session Management</h1>
            
            {/* Form to Add Session */}
            <div className="management-card">
                <h3>Create New Session</h3>
                <form onSubmit={handleCreate} className="input-group">
                    <input type="text" placeholder="Clinic Location" value={formData.clinicName} required
                        onChange={e => setFormData({...formData, clinicName: e.target.value})} />
                    
                    <input type="text" placeholder="Vaccine (e.g. BCG, Polio)" value={formData.vaccineType} required
                        onChange={e => setFormData({...formData, vaccineType: e.target.value})} />
                    
                    <input type="date" value={formData.sessionDate} required
                        onChange={e => setFormData({...formData, sessionDate: e.target.value})} />
                    
                    <input type="number" placeholder="Slots" value={formData.availableSlots} required
                        onChange={e => setFormData({...formData, availableSlots: e.target.value})} />
                    
                    <button type="submit" className="btn-add">Publish Session</button>
                </form>
            </div>

            {/* List of Sessions */}
            <div className="management-card">
                <h3>Active Vaccination Schedules</h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Clinic</th>
                            <th>Vaccine</th>
                            <th>Date</th>
                            <th>Available Slots</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(s => (
                            <tr key={s._id}>
                                <td>{s.clinicName}</td>
                                <td>{s.vaccineType}</td>
                                <td>{new Date(s.sessionDate).toLocaleDateString()}</td>
                                <td>{s.availableSlots}</td>
                                <td>
                                    <button className="btn-delete" onClick={() => handleDelete(s._id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageSchedule;