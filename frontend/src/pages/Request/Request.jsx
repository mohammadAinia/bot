import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './request.css';

function Request() {
  const [systemMessage, setSystemMessage] = useState('');
  const [guidanceMessage, setGuidanceMessage] = useState('');

  useEffect(() => {
    axios
      .get('https://bot-wy40.onrender.com/admin/messages')
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
    axios
      .post('https://bot-wy40.onrender.com/admin/update-messages', { newSystemMessage: systemMessage })
      .then((response) => console.log('System message updated:', response.data))
      .catch((error) => console.error('Error updating system message:', error));
  };

  const handleGuidanceMessageSubmit = (e) => {
    e.preventDefault();
    axios
      .post('/admin/update-messages', { newGuidance: guidanceMessage })
      .then((response) => console.log('Guidance message updated:', response.data))
      .catch((error) => console.error('Error updating guidance message:', error));
  };

  return (
    <div className="request-container">
      <h1 className="header">Bot Guidance Interface</h1>
      
      <div className="form-container">
        {/* System Message Form */}
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

        {/* Guidance Message Form */}
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
