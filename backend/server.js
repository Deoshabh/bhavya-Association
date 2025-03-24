// Load environment variables at the very beginning
require('dotenv').config();

// Log the environment configuration on startup
console.log('Environment configuration:');
console.log('- Node Environment:', process.env.NODE_ENV || 'development');
console.log('- Port:', process.env.PORT || '5000 (default)');
console.log('- MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
console.log('- JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'NOT SET (CRITICAL ERROR)');

// If JWT_SECRET is not set, log a warning
if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not set! Authentication will fail.');
  console.error('Please check your .env file and restart the server.');
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
});

// Routes
// Add your routes here like this:
// const someRouter = require('./routes/some');
// app.use('/api/some', someRouter);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});