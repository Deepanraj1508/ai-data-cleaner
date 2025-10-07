import React from 'react';
import { CheckCircle } from 'lucide-react';
import IssueCard from './IssueCard';

const IssuesSection = ({ analysis, selectedIssues, toggleIssue, applyCleanup, resetTool }) => {
  const selectedCount = Object.values(selectedIssues).filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🔍 Issues Found
        </h2>
        <div className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold">
          {analysis?.stats?.total_rows ?? 0} rows × {analysis?.stats?.total_columns ?? 0} columns
        </div>
      </div>

      {(analysis?.issues?.length ?? 0) === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-gray-700 mb-2">Your data looks great!</p>
          <p className="text-gray-600">No issues detected.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {(analysis?.issues || []).map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                isSelected={selectedIssues[issue.id] || false}
                onToggle={() => toggleIssue(issue.id)}
              />
            ))}
          </div>

          <button
            onClick={applyCleanup}
            disabled={selectedCount === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Apply Selected Fixes ({selectedCount})</span>
          </button>
        </>
      )}

      <button
        onClick={resetTool}
        className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
      >
        Upload Different File
      </button>
    </div>
  );
};

export default IssuesSection;