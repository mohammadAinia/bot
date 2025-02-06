import { adminLogin as loginService } from '../services/authService.js';

export const adminLogin = (req, res) => {
    const { username, password } = req.body;
    const token = loginService(username, password); // Use renamed function
    if (token) {
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
};
