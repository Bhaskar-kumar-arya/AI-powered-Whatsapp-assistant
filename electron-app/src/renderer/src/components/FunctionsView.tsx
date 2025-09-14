import React from 'react';

const FunctionsView: React.FC = () => {
  return (
    <div className="functions-view">
      <h3>AI Functions</h3>
      <ul>
        <li>
          <label>
            <input type="checkbox" defaultChecked /> Summarization
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" defaultChecked /> Draft Replies
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Task Creation
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Message Scheduling
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Calendar Integration
          </label>
        </li>
      </ul>
    </div>
  );
};

export default FunctionsView;