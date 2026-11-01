const mongoose = require('mongoose');

async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Connected to MongoDB successfully!');
        console.log('Database:', mongoose.connection.name);

    } catch (error) {
        console.log('MongoDB connection failed:', error.message);
    }
}

module.exports = connectToDB;