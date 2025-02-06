import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'LoothTech12345';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

export const adminLogin = (username, password) => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    }
    return null;
};

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};