import React from 'react';
import { BarChart3, FileCheck, AlertCircle, Database } from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/formatters';

const HistoryItem = ({ record, onClick }) => {
  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    uploaded: 'bg-gray-100 text-gray-800'
  };

  return (
    <div 
      onClick={() => onClick(record)}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 truncate">{record.original_filename}</h4>
          <p className="text-xs text-gray-500 mt-1">{formatDate(record.upload_date)}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColors[record.status] || statusColors.uploaded}`}>
          {record.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3">
        <div className="flex items-center">
          <BarChart3 className="w-3 h-3 mr-1" />
          {record.total_rows} rows
        </div>
        <div className="flex items-center">
          <FileCheck className="w-3 h-3 mr-1" />
          {record.total_columns} cols
        </div>
        {record.issues_count > 0 && (
          <div className="flex items-center text-orange-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            {record.issues_count} issues
          </div>
        )}
        {record.file_size && (
          <div className="flex items-center">
            <Database className="w-3 h-3 mr-1" />
            {formatBytes(record.file_size)}
          </div>
        )}
      </div>
      
      {record.status === 'completed' && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-green-600">
          <span>✓ {record.rows_removed || 0} removed</span>
          <span>✓ {record.values_fixed || 0} fixed</span>
          <span>✓ {record.columns_renamed || 0} renamed</span>
        </div>
      )}
    </div>
  );
};

export default HistoryItem;