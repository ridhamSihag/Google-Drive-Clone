
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');

const userRouter = require('./routes/user.routes');
const connectToDB = require('./routes/config/db');

const app = express();

// EJS configuration
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to MongoDB
connectToDB();

// User routes
app.use('/user', userRouter);

// Start server
app.listen(3000, () => {
    console.log('Google Drive Clone running on port 3000');
});
