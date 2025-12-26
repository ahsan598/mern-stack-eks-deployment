import axios from 'axios';

const api = axios.create({
  baseURL: '/api/tasks',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Get all tasks
export const getTasks = () => api.get('/');

// Add task
export const addTask = (task) => api.post('/', task);

// Update task
export const updateTask = (id, task) => api.put(`/${id}`, task);

// Delete task
export const deleteTask = (id) => api.delete(`/${id}`);
