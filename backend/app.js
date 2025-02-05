import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import adminRoutes from './routes/adminRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.use('/admin', adminRoutes);
app.use('/', webhookRoutes);

app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));
