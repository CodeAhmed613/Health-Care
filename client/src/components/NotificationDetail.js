import React, { useState } from 'react';
import API from '../api';

const NotificationDetail = ({ notification, onBack, onDelete }) => {
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [showReplyBox, setShowReplyBox] = useState(false);

    if (!notification) return null;
    
   const handleSendReply = async () => {
        if (!reply.trim()) return alert("Please type a message.");
        setSending(true);

        try {
            await API.post('/api/notifications/reply', {
                message: reply,
                senderId: localStorage.getItem('id'),
                senderName: localStorage.getItem('name') || 'Parent',
                originalMessageId: notification._id 
            });

            alert("Reply sent! Admin will see this in their Activity Logs.");
            setReply("");
            setShowReplyBox(false);
            
            if (onBack) onBack(); 
        } catch (err) {
            console.error("Reply Error:", err.response?.data || err.message);
            alert("Failed to send reply. Check the console for the specific error.");
        } finally {
            setSending(false);
        }
    };
    const isAlert = notification.type === 'admin_alert';

    return (
        <div className="notification-detail-view">
            <div style={detailHeaderStyle}>
                <button onClick={onBack} style={backBtnStyle}>← Back</button>
                <button onClick={() => onDelete(notification._id)} style={deleteBtnStyle}>Delete</button>
            </div>

            <div style={contentCardStyle(isAlert)}>
                <div style={metaDataStyle}>
                    <span style={typeBadgeStyle(isAlert)}>
                        {isAlert ? "📢 ADMIN ALERT" : "ℹ️ SYSTEM"}
                    </span>
                    <span style={dateStyle}>{new Date(notification.createdAt).toLocaleString()}</span>
                </div>

                <div style={messageBodyStyle}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{notification.message}</p>
                </div>

                <hr style={dividerStyle} />

                {/* --- REPLY SECTION --- */}
                {!showReplyBox ? (
                    <button 
                        onClick={() => setShowReplyBox(true)} 
                        style={replyToggleBtn}
                    >
                        💬 Reply to Admin
                    </button>
                ) : (
                    <div style={{ marginTop: '20px' }}>
                        <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Write your response..."
                            style={replyInputStyle}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button 
                                onClick={handleSendReply} 
                                disabled={sending}
                                style={sendBtnStyle}
                            >
                                {sending ? "Sending..." : "Send Reply"}
                            </button>
                            <button 
                                onClick={() => setShowReplyBox(false)} 
                                style={{ ...backBtnStyle, color: '#666' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- ADDITIONAL STYLES ---
const replyToggleBtn = {
    background: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const replyInputStyle = {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
};

const sendBtnStyle = {
    background: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

// ... (Previous styles from NotificationDetail remain the same)
const detailHeaderStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' };
const contentCardStyle = (isAlert) => ({ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '30px' });
const typeBadgeStyle = (isAlert) => ({ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', background: isAlert ? '#d9534f' : '#007bff', color: '#fff' });
const metaDataStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' };
const dateStyle = { fontSize: '0.85rem', color: '#888' };
const dividerStyle = { border: '0', borderTop: '1px solid #eee', margin: '20px 0' };
const messageBodyStyle = { fontSize: '1.05rem', color: '#333' };
const backBtnStyle = { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: '600' };
const deleteBtnStyle = { background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' };

export default NotificationDetail;