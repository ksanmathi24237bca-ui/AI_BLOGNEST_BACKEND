
const mongoose = require('mongoose');
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    
    console.error(
      'MONGO_URI is not defined. Add it to your .env file (see .env.example).'
    );
    process.exit(1);
  }

  try {
    
    const conn = await mongoose.connect(uri);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
   
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB runtime error: ${err.message}`);
});
module.exports = connectDB;
