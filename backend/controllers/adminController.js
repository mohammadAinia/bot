import jwt from 'jsonwebtoken';
import { SECRET_KEY, ADMIN_USERNAME, ADMIN_PASSWORD } from '../config';

export const loginAdmin = (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    }
    return res.status(401).json({ error: 'Invalid username or password' });
};
