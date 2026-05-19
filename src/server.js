require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const webhookRoutes = require('./routes/webhook');
const dashboardRoutes = require('./routes/dashboard');
const { startEscalationChecker } = require('./services/escalationChecker');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`🌐 ${req.method} ${req.url}`);
  next();
});
app.use(express.static(path.join(__dirname, '../dashboard')));

// Routes
app.use('/webhooks', webhookRoutes);
app.use('/api', dashboardRoutes);
app.use('/dashboard', dashboardRoutes); // alias for step-guide curl commands

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'RecoverAI Agent is running 🚀', time: new Date() });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`RecoverAI server running on port ${PORT}`);
  startEscalationChecker(); // Start the cron job
});
