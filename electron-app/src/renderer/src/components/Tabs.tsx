import React, { useState, ReactNode } from 'react';

interface TabsProps {
  tabs: { label: string; content: ReactNode }[];
  initialTab?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0]?.label);

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`tab-button ${activeTab === tab.label ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.label)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {tabs.find((tab) => tab.label === activeTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;