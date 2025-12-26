import { Component } from 'react';
import { getTasks, addTask, updateTask, deleteTask } from './services/taskServices';

class Tasks extends Component {
  state = { tasks: [], currentTask: '' };

  async componentDidMount() {
    try {
      const { data } = await getTasks();
      this.setState({ tasks: data });
    } catch (err) {
      console.error(err);
    }
  }

  handleChange = (e) => {
    this.setState({ currentTask: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    if (!this.state.currentTask.trim()) return;

    try {
      const { data } = await addTask({ task: this.state.currentTask });
      this.setState({
        tasks: [...this.state.tasks, data],
        currentTask: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  handleUpdate = async (id) => {
    const original = [...this.state.tasks];
    try {
      const tasks = original.map(t =>
        t._id === id ? { ...t, completed: !t.completed } : t
      );
      this.setState({ tasks });
      const updated = tasks.find(t => t._id === id);
      await updateTask(id, { completed: updated.completed });
    } catch (err) {
      this.setState({ tasks: original });
      console.error(err);
    }
  };

  handleDelete = async (id) => {
    const original = [...this.state.tasks];
    try {
      this.setState({ tasks: original.filter(t => t._id !== id) });
      await deleteTask(id);
    } catch (err) {
      this.setState({ tasks: original });
      console.error(err);
    }
  };

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <input
            value={this.state.currentTask}
            onChange={this.handleChange}
            placeholder="Add task"
          />
          <button type="submit">Add</button>
        </form>

        {this.state.tasks.map(task => (
          <div key={task._id}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => this.handleUpdate(task._id)}
            />
            {task.task}
            <button onClick={() => this.handleDelete(task._id)}>Delete</button>
          </div>
        ))}
      </div>
    );
  }
}

export default Tasks;
