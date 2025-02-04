import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import Request from './pages/Request/Request';
import Login from './pages/Login/Login';
import WelcomeMessage from './pages/WelcomeMessage/WelcomeMessage';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} />} 
                />
                <Route 
                    path="/" 
                    // element={isAuthenticated ? <Request setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" />} 
                    element={isAuthenticated ? <WelcomeMessage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" />} 

                />
                
            </Routes>
        </Router>
    );
}

export default App;
