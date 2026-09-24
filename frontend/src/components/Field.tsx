import React from 'react';

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-bold text-stone-700 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-stone-400 mt-1">{hint}</span>}
  </label>
);
