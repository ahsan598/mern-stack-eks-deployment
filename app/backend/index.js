import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import tasks from "./routes/tasks.js";
import connection from "./db.js";

const app = express();

// Database Connection
await connection();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get('/ok', (req, res) => {
    res.status(200).send('ok');
});

app.use("/api/tasks", tasks);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}...`));
