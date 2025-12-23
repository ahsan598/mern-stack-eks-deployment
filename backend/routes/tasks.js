const Task = require("../models/task");
const express = require("express");
const router = express.Router();

// CREATE
router.post("/", async (req, res) => {
  try {
    if (!req.body.task || req.body.task.trim() === '') {
      return res.status(400).json({ error: "Task name is required" });
    }
    
    const task = new Task(req.body);
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(400).json({ error: error.message });
  }
});

// READ ALL
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }  // Return updated doc
    );
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.status(200).json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

module.exports = router;
