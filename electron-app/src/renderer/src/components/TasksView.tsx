import React from 'react';

const TasksView: React.FC = () => {
  return (
    <div className="tasks-view">
      <h3>My Tasks</h3>
      <ul>
        <li>[ ] Send Q3 report to Project Team (Due: 2025-09-10)</li>
        <li>[x] Call Sarah about weekend picnic (Completed: 2025-09-05)</li>
        <li>[ ] Follow up with John Doe on meeting notes (Due: 2025-09-07)</li>
        <li>[ ] Schedule happy birthday message to Mom (Due: 2025-09-15)</li>
      </ul>
    </div>
  );
};

export default TasksView;