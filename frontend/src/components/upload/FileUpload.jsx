import React from 'react';
import { Upload } from 'lucide-react';

const FileUpload = ({ onFileUpload }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
        <Upload className="w-20 h-20 text-blue-500 mb-4" />
        <span className="text-2xl font-semibold text-gray-700 mb-2">
          Drop your file here or click to browse
        </span>
        <span className="text-sm text-gray-500">
          Supports CSV and XLSX files (up to 10MB)
        </span>
        <input
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={onFileUpload}
        />
      </label>
    </div>
  );
};

export default FileUpload;