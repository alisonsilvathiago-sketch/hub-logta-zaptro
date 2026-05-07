import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8788;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic route for Logta SaaS
app.get('/', (req, res) => {
  res.json({ 
    message: 'Logta SaaS API - Professional Transportation System',
    version: '1.0.0'
  });
});

app.listen(port, () => {
  console.log(`[server]: Logta SaaS API is running at http://localhost:${port}`);
});
