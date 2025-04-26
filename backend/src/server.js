const express = require('express');
const cors = require('cors');
const stockRoutes = require('./routes/stock');

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:4321', 'https://your-vercel-app.vercel.app'], // Update for production
}));

app.use(express.json());

// Routes
app.use('/stock', stockRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});