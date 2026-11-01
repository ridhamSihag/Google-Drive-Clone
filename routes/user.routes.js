
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user.models');

// =====================================
// REGISTER PAGE
// =====================================

router.get('/register', (req, res) => {
    res.render('register');
});

// =====================================
// REGISTRATION SUCCESS PAGE
// =====================================

router.get('/registered', (req, res) => {
    res.render('success');
});

// =====================================
// LOGIN PAGE
// =====================================

router.get('/login', (req, res) => {
    res.render('login');
});

// =====================================
// REGISTER USER
// =====================================

router.post('/register', async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password
        } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).send(
                'Please fill all the fields'
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).send(
                'Email already exists'
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        await newUser.save();

        console.log('Registration successful');

        return res.redirect('/user/registered');

    } catch (error) {
        console.error('Registration error:', error);

        if (error.code === 11000) {
            return res.status(400).send(
                'Email already exists'
            );
        }

        return res.status(500).send(
            'Registration failed'
        );
    }
});

// =====================================
// LOGIN USER AND GENERATE JWT
// =====================================

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send(
                'Please enter email and password'
            );
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Find user in MongoDB
        const user = await User.findOne({
            email: normalizedEmail
        });

        // Check if user exists
        if (!user) {
            return res.status(401).send(
                'Wrong email or password'
            );
        }

        // Compare password with bcrypt hash
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).send(
                'Wrong email or password'
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        console.log('Login successful');

        // Send token to frontend
        return res.json({
            message: 'User logged in successfully!',
            token: token
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).send(
            'Something went wrong during login'
        );
    }
});

module.exports = router;
