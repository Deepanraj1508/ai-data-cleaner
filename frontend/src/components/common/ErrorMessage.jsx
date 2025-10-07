import React from 'react';
import { XCircle } from 'lucide-react';

const ErrorMessage = ({ error }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-md">
      <div className="flex items-center space-x-2">
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div>
          <span className="text-red-800 font-semibold">Error: </span>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;