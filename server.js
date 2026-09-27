
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`AI BlogNest server is running on http://localhost:${PORT}`);
  });
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
