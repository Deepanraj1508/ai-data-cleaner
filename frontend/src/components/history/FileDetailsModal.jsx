import React from 'react';
import { XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/formatters';

const FileDetailsModal = ({ record, onClose }) => {
  const parseIssues = (issuesData) => {
  try {
    const issues = typeof issuesData === 'string' ? JSON.parse(issuesData) : issuesData;
    if (Array.isArray(issues)) {
      return issues.map((issue, i) => {
        const text = typeof issue === 'object'
          ? issue.title || JSON.stringify(issue)
          : issue;

        return (
          <div key={i} className="text-xs text-yellow-700">• {text}</div>
        );
      });
    }
    return <div className="text-xs text-yellow-700">Issues data available</div>;
  } catch {
    return <div className="text-xs text-yellow-700">• {record.issues_count} issues found</div>;
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{record.original_filename}</h3>
              <p className="text-sm text-gray-500 mt-1">{formatDate(record.upload_date)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">File Size</p>
              <p className="text-lg font-semibold text-blue-800">{formatBytes(record.file_size)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600 mb-1">Status</p>
              <p className="text-lg font-semibold text-green-800">{record.status}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-purple-600 mb-1">Total Rows</p>
              <p className="text-lg font-semibold text-purple-800">{record.total_rows}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-xs text-orange-600 mb-1">Total Columns</p>
              <p className="text-lg font-semibold text-orange-800">{record.total_columns}</p>
            </div>
          </div>

          {record.issues_count > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 font-semibold mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                {record.issues_count} Issues Detected
              </p>
              {record.issues_found && (
                <div className="space-y-1">
                  {parseIssues(record.issues_found)}
                </div>
              )}
            </div>
          )}

          {record.status === 'completed' && record.cleaned_filename && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 font-semibold mb-2">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Cleaning Completed
              </p>
              <p className="text-xs text-green-700 mb-2">
                Cleaned file: <span className="font-mono">{record.cleaned_filename}</span>
              </p>
              <p className="text-xs text-green-600">
                Completed: {formatDate(record.cleaned_date)}
              </p>
              <div className="mt-3 flex gap-3 text-xs">
                <span className="bg-green-100 px-2 py-1 rounded">
                  {record.rows_removed} rows removed
                </span>
                <span className="bg-green-100 px-2 py-1 rounded">
                  {record.values_fixed} values fixed
                </span>
                <span className="bg-green-100 px-2 py-1 rounded">
                  {record.columns_renamed} columns renamed
                </span>
              </div>
            </div>
          )}

          {record.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-semibold mb-1">
                <XCircle className="w-4 h-4 inline mr-1" />
                Error
              </p>
              <p className="text-xs text-red-700">{record.error_message}</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileDetailsModal;