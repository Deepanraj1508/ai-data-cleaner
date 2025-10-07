import React from 'react';
import { FileSpreadsheet, FileJson, Database } from 'lucide-react';
import DataTable from '../common/DataTable';
import { API_BASE_URL } from '../../config';

const CleanedDataView = ({ cleanedData, fileId, resetTool, setLoading, setLoadingMessage, setError }) => {
  const downloadFile = async (format) => {
    try {
      setLoading(true);
      setLoadingMessage(`Preparing ${format} download...`);

      const response = await fetch(`${API_BASE_URL}/download/${fileId}/${format.toLowerCase()}`);
      if (!response.ok) throw new Error(`Failed to download ${format}`);

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `cleaned_data.${format.toLowerCase()}`;
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches?.[1]) filename = matches[1].replace(/['"]/g, '');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          ✨ Data Cleaned Successfully!
        </h2>
        
        {cleanedData?.cleaned_filename && (
          <div className="mb-4">
            <span className="text-gray-600">Saved as: </span>
            <span className="font-mono bg-green-100 text-green-800 px-3 py-1 rounded-lg">
              {cleanedData.cleaned_filename}
            </span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-4 mb-3">
          <div className="bg-green-50 px-4 py-2 rounded-lg">
            <span className="text-green-700 font-semibold">✓ {cleanedData?.changes?.rows_removed ?? 0}</span>
            <span className="text-green-600 text-sm ml-1">rows removed</span>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-blue-700 font-semibold">✓ {cleanedData?.changes?.values_fixed ?? 0}</span>
            <span className="text-blue-600 text-sm ml-1">values fixed</span>
          </div>
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <span className="text-purple-700 font-semibold">✓ {cleanedData?.changes?.columns_renamed ?? 0}</span>
            <span className="text-purple-600 text-sm ml-1">columns renamed</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          Final dataset: {cleanedData?.stats?.cleaned_rows ?? 0} rows × {cleanedData?.preview?.columns?.length ?? 0} columns
        </div>
      </div>

      <DataTable 
        columns={cleanedData?.preview?.columns} 
        rows={cleanedData?.preview?.rows} 
        className="mb-6 rounded-lg overflow-hidden border border-gray-200"
      />

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Download Cleaned Data:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => downloadFile('csv')}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => downloadFile('xlsx')}
            className="flex items-center justify-center space-x-2 bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-md"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => downloadFile('json')}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md"
          >
            <FileJson className="w-5 h-5" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => downloadFile('sql')}
            className="flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Database className="w-5 h-5" />
            <span>SQL</span>
          </button>
        </div>
      </div>

      <button
        onClick={resetTool}
        className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
      >
        Clean Another File
      </button>
    </div>
  );
};

export default CleanedDataView;