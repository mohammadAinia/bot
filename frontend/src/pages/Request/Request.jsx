import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './request.css';

function Request({ setIsAuthenticated }) {
    const [systemMessage, setSystemMessage] = useState('');
    const [guidanceMessage, setGuidanceMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('https://bot-wy40.onrender.com/admin/messages', {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
            setSystemMessage(response.data.systemMessage || '');
            setGuidanceMessage(response.data.guidanceMessage || '');
        })
        .catch((error) => {
            console.error('Error fetching messages:', error);
        });
    }, []);

    const handleSystemMessageSubmit = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        axios.post('https://bot-wy40.onrender.com/admin/update-messages',
            { newSystemMessage: systemMessage },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => console.log('System message updated:', response.data))
        .catch((error) => console.error('Error updating system message:', error));
    };

    const handleGuidanceMessageSubmit = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        axios.post('https://bot-wy40.onrender.com/admin/update-messages',
            { newGuidance: guidanceMessage },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => console.log('Guidance message updated:', response.data))
        .catch((error) => console.error('Error updating guidance message:', error));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login');
    };

    return (
        <div className="request-container">
            <h1 className="header">Bot Guidance Interface</h1>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            <div className="form-container">
                <form className="form" onSubmit={handleSystemMessageSubmit}>
                    <div className="form-group">
                        <label className="label" htmlFor="systemMessage">System Message:</label>
                        <textarea
                            id="systemMessage"
                            className="textarea"
                            rows={6}
                            value={systemMessage}
                            onChange={(e) => setSystemMessage(e.target.value)}
                            placeholder="Enter system message"
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">Save System Message</button>
                </form>

                <form className="form" onSubmit={handleGuidanceMessageSubmit}>
                    <div className="form-group">
                        <label className="label" htmlFor="guidanceMessage">Guidance Message:</label>
                        <textarea
                            id="guidanceMessage"
                            className="textarea"
                            rows={6}
                            value={guidanceMessage}
                            onChange={(e) => setGuidanceMessage(e.target.value)}
                            placeholder="Enter guidance message"
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">Save Guidance Message</button>
                </form>
            </div>
        </div>
    );
}

export default Request;
