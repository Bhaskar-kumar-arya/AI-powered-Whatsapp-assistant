import React from 'react';
import Tabs from './Tabs';
import CoPilotView from './CoPilotView';
import SummaryView from './SummaryView';
import TasksView from './TasksView';
import DraftsView from './DraftsView';
import FunctionsView from './FunctionsView';

const Pane3_AIPanel: React.FC = () => {
  const tabs = [
    { label: 'Co-pilot', content: <CoPilotView /> },
    { label: 'Summary', content: <SummaryView /> },
    { label: 'Tasks', content: <TasksView /> },
    { label: 'Drafts', content: <DraftsView /> },
    { label: 'Functions', content: <FunctionsView /> },
  ];

  return (
    <div className="pane3-ai-panel">
      <Tabs tabs={tabs} />
    </div>
  );
};

export default Pane3_AIPanel;