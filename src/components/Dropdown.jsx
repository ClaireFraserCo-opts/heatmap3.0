// src/components/Dropdown.jsx

import React from 'react';

const Dropdown = ({ files, onChange }) => (
  <select onChange={(e) => onChange(e.target.value)}>
    <option value="">Select a file</option>
    {files.map(file => (
      <option key={file} value={file}>{file}</option>
    ))}
  </select>
);

export default Dropdown;
