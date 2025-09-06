import React from 'react';

const SummaryView: React.FC = () => {
  return (
    <div className="summary-view">
      <h3>Chat Summaries</h3>
      <ul>
        <li>Summary of "Project Team" chat: Discussed Q3 goals and action items.</li>
        <li>Summary of "Family Group" chat: Planned weekend picnic.</li>
        <li>Summary of "John Doe" chat: Followed up on meeting notes.</li>
      </ul>
    </div>
  );
};

export default SummaryView;