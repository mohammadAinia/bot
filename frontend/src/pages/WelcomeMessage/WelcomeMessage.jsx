import './WelcomeMessage.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function WelcomeMessage({ setIsAuthenticated }) {
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('https://bot-wy40.onrender.com/admin/messages', {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
            setWelcomeMessage(response.data.defaultWelcomeMessage || '');
        })
        .catch((error) => {
            console.error('Error fetching messages:', error);
        });
    }, []);

    const handleWelcomeMessageSubmit = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        axios.post('https://bot-wy40.onrender.com/admin/update-welcome-message',
            { newWelcomeMessage: welcomeMessage },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => console.log('Welcome message updated:', response.data))
        .catch((error) => console.error('Error updating Welcome message:', error));
    };

    return (
        <div className="request-container">
            <h1 className="header">Edit Welcome Message</h1>
            <button onClick={() => navigate('/')} className="navigate-btn">Go to Request Page</button>
            <div className="form-container">
                <form className="form" onSubmit={handleWelcomeMessageSubmit}>
                    <div className="form-group">
                        <label className="label" htmlFor="welcomeMessage">Welcome Message:</label>
                        <textarea
                            id="welcomeMessage"
                            className="textarea"
                            rows={6}
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            placeholder="Enter Welcome message"
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">Save</button>
                </form>
            </div>
        </div>
    );
}

export default WelcomeMessage;
