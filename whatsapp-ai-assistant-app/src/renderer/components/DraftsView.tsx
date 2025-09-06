import React from 'react';

const DraftsView: React.FC = () => {
  return (
    <div className="drafts-view">
      <h3>AI Drafts</h3>
      <ul>
        <li>Draft reply for "Project Team": "Sure, I'll send the report by end of day."</li>
        <li>Draft message for Sarah: "Looking forward to the picnic!"</li>
        <li>Draft email to John Doe: "Following up on our meeting, here are the notes..."</li>
      </ul>
    </div>
  );
};

export default DraftsView;