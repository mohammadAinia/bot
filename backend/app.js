import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import authRoutes from './routes/authRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());

app.use('/admin', adminRoutes);
app.use('/webhook', webhookRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running on');
});

app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));

//test