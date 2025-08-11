require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

//Import database connection
const connectDB = require('./config/db');
//Import routes
const authRoutes = require('./routes/auth');

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
//Middleware for cookie parsing
app.use(cookieParser());
//Middleware logging
app.use(morgan(process.env.NODE_ENV == 'production' ? 'combined' : 'dev'));
//Middleware body parsing
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));
//Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

//Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Job Tracker API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

//API routes
app.use('/api/auth', authRoutes);

//Error handling middlewar
app.use((err, req, res, next) => {
    console.error(err.stack);
    //Handle different error types
    if(err.name === 'ValidationError'){
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    if(err.name === 'CastError'){
        return res.status(400).json({
            status: 'error',
            message: 'Invalid ID format'
        });
    }
    //JWT errors
    if(err.name === 'JsonWebTokenError'){
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
    if(err.name === 'TokenExpiredError'){
        return res.status(401).json({
            status: 'error',
            message: 'Token expired'
        });
    }
    //Mongoose duplicate key error
    if(err.code === 11000){
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        return res.status(400).json({
            status: 'error',
            message: `${field} ${value} already exists`
        });
    }
    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' ? 'Oops. Nothing to see here.': err.message
    });
});

//404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`
    });
});

module.exports = app;