const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// Route imports
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const resultsRoutes = require('./routes/results');
const usersRoutes = require('./routes/users');
const academicRoutes = require('./routes/academic');
const pingRoutes = require('./routes/ping');
const { cleanupUnverifiedUsers } = require('./utils/cleanupUnverifiedUsers');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
// Increase JSON body size to allow large base64 uploads (up to ~200MB)
app.use(express.json({ limit: '200mb' }));
// Ensure uploads dir exists and serve it statically with inline disposition
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    const name = path.basename(filePath);
    res.setHeader('Content-Disposition', `inline; filename="${name}"`);
    if (path.extname(name).toLowerCase() === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    }
  }
}));

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/ping', pingRoutes);


// Test route
app.get('/api/test', (req, res) => {
  res.json({ status: 'Server is running' });
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running and listening on http://${HOST}:${PORT}`);

  // Start the cleanup process after server starts
  //cleanupUnverifiedUsers();
});

// Error handling middleware (catches multer errors like file too large)
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error('Express error handler:', err);
  if (err.code === 'LIMIT_FILE_SIZE' || (err.message && err.message.includes('File too large'))) {
    return res.status(413).json({ error: 'File too large. Maximum allowed size is 200MB.' });
  }
  res.status(500).json({ error: err.message || 'Server error' });
});