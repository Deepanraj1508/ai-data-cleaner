import React from 'react';
import { renderValue } from '../../utils/renderHelpers';

const DataTable = ({ columns, rows, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
            {(columns || []).map((col, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-300">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((row, i) => (
            <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-gray-600 border border-gray-200">
                  {renderValue(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;