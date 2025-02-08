const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./config/database');
const errorHandler = require('./src/middleware/errorHandler');
require('dotenv').config();

const app = express();
const User = require('./src/models/user');

module.exports = {
    User
};
// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static dosya sunumu
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/credit-book', require('./src/routes/creditBookRoutes'));

// Error handling
app.use(errorHandler);

module.exports = app;