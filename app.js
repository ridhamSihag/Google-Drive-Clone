require('dotenv').config();

const express = require('express');
const userRouter = require('./routes/user.routes');
const connectToDB = require('./routes/config/db');

const app = express();

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectToDB();

app.use('/user', userRouter);

app.listen(3000, () => {
    console.log('Drive is running on port 3000');
});