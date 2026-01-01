import express from "express";
import Task from "../models/task.js";

const router = express.Router();

// Create Task
router.post("/", async (req, res) => {
    try {
        const task = await Task.create(req.body);
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get All Tasks
router.get("/", async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Task
router.put("/:id", async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id },
            req.body,
            { new: true }
        );
        
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete Task
router.delete("/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
