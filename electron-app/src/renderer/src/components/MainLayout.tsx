import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isPane3Collapsed, setIsPane3Collapsed] = useState(false);

  const togglePane3 = () => {
    setIsPane3Collapsed(!isPane3Collapsed);
  };

  return (
    <div className={`main-layout ${isPane3Collapsed ? 'pane3-collapsed' : ''}`}>
      {React.Children.map(children, (child, index) => {
        if (index === 2) {
          return (
            <div className={`pane3-container ${isPane3Collapsed ? 'collapsed' : ''}`}>
              <button onClick={togglePane3} className="collapse-button">
                {isPane3Collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
              {child}
            </div>
          );
        }
        return child;
      })}
    </div>
  );
};

export default MainLayout;