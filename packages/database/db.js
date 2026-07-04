require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI

const connectDB = async () => {
  try {
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;