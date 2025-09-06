import React from 'react';
import useStore from '../store';

const SummaryView: React.FC = () => {
  const aiSummary = useStore((state) => state.aiSummary);

  return (
    <div className="summary-view">
      <h3>AI Chat Summary</h3>
      {aiSummary ? (
        <p>{aiSummary}</p>
      ) : (
        <p>No summary generated yet. Click "Summarize Chat" in the conversation view.</p>
      )}
    </div>
  );
};

export default SummaryView;