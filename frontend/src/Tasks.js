import {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
} from './services/taskServices';

class Tasks {
  constructor(component) {
    this.component = component;
  }

  async loadTasks() {
    try {
      const { data } = await getTasks();
      this.component.setState({ tasks: data });
    } catch (error) {
      console.error(error);
    }
  }

  handleChange = (e) => {
    this.component.setState({ currentTask: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    const { currentTask } = this.component.state;

    try {
      await addTask({ task: currentTask });
      this.component.setState({ currentTask: '' });

      await this.loadTasks();
    } catch (error) {
      console.error(error);
    }
  };


  handleUpdate = async (id) => {
    const originalTasks = [...this.component.state.tasks];

    try {
      const tasks = originalTasks.map(task =>
        task._id === id ? { ...task, completed: !task.completed } : task
      );

      this.component.setState({ tasks });

      const updatedTask = tasks.find(task => task._id === id);
      await updateTask(id, { completed: updatedTask.completed });

    } catch (error) {
      this.component.setState({ tasks: originalTasks });
      console.error(error);
    }
  };

  handleDelete = async (id) => {
    const originalTasks = [...this.component.state.tasks];

    try {
      const tasks = originalTasks.filter(task => task._id !== id);
      this.component.setState({ tasks });
      await deleteTask(id);
    } catch (error) {
      this.component.setState({ tasks: originalTasks });
      console.error(error);
    }
  };
}

export default Tasks;
