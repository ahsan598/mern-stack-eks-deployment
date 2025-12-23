const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true          //createdAt, updatedAt auto add
});

module.exports = mongoose.model("Task", taskSchema);
