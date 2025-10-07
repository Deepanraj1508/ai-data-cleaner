import React from 'react';

export const renderValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-red-400 italic">empty</span>;
  }
  return String(value);
};