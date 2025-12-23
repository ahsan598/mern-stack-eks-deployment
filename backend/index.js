const tasks = require("./routes/tasks");
const connection = require("./db");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const app = express();

// Connect to database with proper error handling
connection().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

app.use(express.json());
app.use(cors());

// Health check with DB status
app.get('/ok', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use("/api/tasks", tasks);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
