const mongoose = require("mongoose");

module.exports = async () => {
  try {
    const connectionParams = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const useDBAuth = process.env.USE_DB_AUTH === 'true';
    if (useDBAuth) {
      connectionParams.auth = {
        username: process.env.MONGO_USERNAME,
        password: process.env.MONGO_PASSWORD
      };
      connectionParams.authSource = 'admin';
    }

    const connStr = process.env.MONGO_CONN_STR || 'mongodb://localhost:27017/myapp';
    
    await mongoose.connect(connStr, connectionParams);
    console.log("Connected to database successfully!");

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (error) {
    console.error("Could not connect to database:", error.message);
    process.exit(1);                // Exit on connection failure
  }
};
