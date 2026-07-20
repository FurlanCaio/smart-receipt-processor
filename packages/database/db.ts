import 'dotenv/config';

import mongoose from 'mongoose';

const mongoURI: string | undefined = process.env.MONGO_URI;

export const connectDB = async () => {
  try {
    mongoose.set('bufferCommands', false);

    if(!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB!');
  } catch (error) {
    if(error instanceof Error) {
      console.error('Error connecting to MongoDB:', error.message);
    }
    process.exit(1);
  }
};