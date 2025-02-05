import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes';

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());

app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
