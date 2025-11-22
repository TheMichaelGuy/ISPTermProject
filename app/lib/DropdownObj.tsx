"use client"; // needed in Next.js app router for client components

import React from "react";

export type DropdownProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

const DropdownObj: React.FC<DropdownProps> = ({ label, options, value, onChange }) => {
  return (
    <div className="variable">
      <label>{label}:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="DropdownObj">
        <option value="">Select {label}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropdownObj;
