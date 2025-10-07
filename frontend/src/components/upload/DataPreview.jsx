import React from 'react';
import DataTable from '../common/DataTable';

const DataPreview = ({ preview, analysis }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📊 Data Preview
        </h2>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          Showing {preview?.rows?.length ?? 0} of {analysis?.stats?.total_rows ?? preview?.rows?.length ?? 0} rows
        </div>
      </div>
      <DataTable 
        columns={preview?.columns} 
        rows={preview?.rows} 
        className="rounded-lg overflow-hidden border border-gray-200" 
      />
    </div>
  );
};

export default DataPreview;