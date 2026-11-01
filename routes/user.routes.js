
const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('../models/user.models');


// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

function isLoggedIn(req, res, next) {

    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/user/login');
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        res.clearCookie('token');

        return res.redirect('/user/login');

    }
}


// =====================================
// MULTER CONFIGURATION
// =====================================

// Create uploads folder automatically

const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(uploadDir, {
        recursive: true
    });

}


// Configure file storage

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, uploadDir);

    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() + '-' +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});


// Create upload middleware

const upload = multer({

    storage: storage,

    limits: {
        fileSize: 25 * 1024 * 1024
    }

});


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


        // Check required fields

        if (
            !first_name ||
            !last_name ||
            !email ||
            !password
        ) {

            return res.status(400).send(
                'Please fill all the fields'
            );

        }


        // Normalize email

        const normalizedEmail =
            email.trim().toLowerCase();


        // Check existing email

        const existingUser = await User.findOne({

            email: normalizedEmail

        });


        if (existingUser) {

            return res.status(400).send(
                'Email already exists'
            );

        }


        // Hash password

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // Create new user

        const newUser = new User({

            first_name: first_name.trim(),

            last_name: last_name.trim(),

            email: normalizedEmail,

            password: hashedPassword

        });


        // Save user

        await newUser.save();


        console.log('Registration successful');


        // Redirect to success page

        return res.redirect('/user/registered');


    } catch (error) {

        console.error(
            'Registration error:',
            error
        );


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
// LOGIN USER
// =====================================

router.post('/login', async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // Check required fields

        if (!email || !password) {

            return res.status(400).send(
                'Please enter email and password'
            );

        }


        // Normalize email

        const normalizedEmail =
            email.trim().toLowerCase();


        // Find user

        const user = await User.findOne({

            email: normalizedEmail

        });


        if (!user) {

            return res.status(401).send(
                'Wrong email or password'
            );

        }


        // Compare password

        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isPasswordCorrect) {

            return res.status(401).send(
                'Wrong email or password'
            );

        }


        // Generate JWT

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


        // Store JWT in cookie

        res.cookie('token', token, {

            httpOnly: true,

            secure:
                process.env.NODE_ENV === 'production',

            sameSite: 'lax',

            maxAge: 60 * 60 * 1000

        });


        console.log(
            'Login successful. JWT stored in cookie.'
        );


        // Redirect to home page

        return res.redirect('/user/home');


    } catch (error) {

        console.error(
            'Login error:',
            error
        );


        return res.status(500).send(
            'Something went wrong during login'
        );

    }

});


// =====================================
// HOME PAGE
// =====================================

router.get(
    '/home',
    isLoggedIn,
    (req, res) => {

        res.render('home');

    }
);


// =====================================
// UPLOAD FILE
// =====================================

router.post(
    '/upload',
    isLoggedIn,
    upload.single('myFile'),
    (req, res) => {

        try {

            // Check if file is selected

            if (!req.file) {

                return res.status(400).send(
                    'Please select a file'
                );

            }


            console.log(
                'Uploaded file:',
                req.file.originalname
            );


            console.log(
                'Saved filename:',
                req.file.filename
            );


            // Send success response

            return res.send(`

                <h2>File uploaded successfully!</h2>

                <p>
                    File name: ${req.file.originalname}
                </p>

                <a href="/user/home">
                    Back to Home
                </a>

            `);


        } catch (error) {

            console.error(
                'Upload error:',
                error
            );


            return res.status(500).send(
                'File upload failed'
            );

        }

    }
);


// =====================================
// LOGOUT USER
// =====================================

router.get('/logout', (req, res) => {

    res.clearCookie('token', {

        httpOnly: true,

        secure:
            process.env.NODE_ENV === 'production',

        sameSite: 'lax'

    });


    return res.redirect('/user/login');

});


module.exports = router;
