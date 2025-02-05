import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import Request from './pages/Request/Request';
import Login from './pages/Login/Login';
import WelcomeMessage from './pages/WelcomeMessage/WelcomeMessage';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    useEffect(() => {
        let logoutTimer;

        const resetTimer = () => {
            clearTimeout(logoutTimer);
            logoutTimer = setTimeout(() => {
                localStorage.removeItem('token');
                setIsAuthenticated(false);
                window.location.href = '/login'; // Redirect to login page
            }, 10 * 60 * 1000); // 10 minutes
        };

        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];

        activityEvents.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer(); // Start the timer on load

        return () => {
            clearTimeout(logoutTimer);
            activityEvents.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, []);

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} />} 
                />
                <Route 
                    path="/" 
                    element={isAuthenticated ? <Request setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" />} 
                />
                <Route 
                    path="/welcome-message" 
                    element={isAuthenticated ? <WelcomeMessage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" />}
                />
            </Routes>
        </Router>
    );
}

export default App;
