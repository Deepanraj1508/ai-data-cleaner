import React from 'react';
import SeverityBadge from '../common/SeverityBadge';

const IssueCard = ({ issue, isSelected, onToggle }) => {
  return (
    <div className={`border rounded-xl p-4 transition-all ${
      isSelected ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="mt-1">
            <SeverityBadge severity={issue.severity} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">{issue.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
            
            {issue.examples?.length > 0 && (
              <div className="text-xs text-gray-500 mb-2 bg-gray-50 p-2 rounded">
                <span className="font-semibold">Examples:</span> {issue.examples.join(', ')}
              </div>
            )}
            
            {issue.suggestion && (
              <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded-lg mb-2">
                💡 {issue.suggestion}
              </div>
            )}
            
            {issue.suggestions?.length > 0 && (
              <div className="mt-2 space-y-1">
                {issue.suggestions.map((s, i) => (
                  <div key={i} className="text-xs bg-green-50 p-2 rounded">
                    <span className="text-gray-600">{s.from}</span>
                    <span className="mx-2">→</span>
                    <span className="font-semibold text-green-700">{s.to}</span>
                  </div>
                ))}
              </div>
            )}
            
            {issue.columns && (
              <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                <span className="font-semibold">Affected columns:</span> {
                  Array.isArray(issue.columns) 
                    ? issue.columns.join(', ') 
                    : Object.keys(issue.columns).join(', ')
                }
              </div>
            )}
            
            {issue.ai_suggestion && (
              <div className="mt-2 text-sm text-purple-700 bg-purple-50 p-2 rounded-lg">
                🤖 AI: {issue.ai_suggestion}
              </div>
            )}
          </div>
        </div>
        <label className="flex items-center cursor-pointer ml-4 flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
        </label>
      </div>
    </div>
  );
};

export default IssueCard;