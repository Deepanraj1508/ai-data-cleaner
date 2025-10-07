import React, { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, Loader, Eye, Database, FileJson, FileSpreadsheet } from 'lucide-react';

const DataCleaningTool = () => {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [cleanedData, setCleanedData] = useState(null);
  const [selectedIssues, setSelectedIssues] = useState({});
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8000/api/v1';

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setLoadingMessage('Uploading and analyzing file...');
    setError(null);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadData = await uploadResponse.json();
      setFileId(uploadData.file_id);
      setPreview(uploadData.preview);

      // Analyze data
      setLoadingMessage('AI is analyzing your data...');
      const analysisResponse = await fetch(`${API_BASE_URL}/analyze/${uploadData.file_id}`, {
        method: 'POST',
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze data');
      }

      const analysisData = await analysisResponse.json();
      setAnalysis(analysisData);

      // Initialize selected issues (all selected by default). Be defensive if issues is missing.
      const initialSelected = {};
      (analysisData.issues || []).forEach(issue => {
        initialSelected[issue.id] = true;
      });
      setSelectedIssues(initialSelected);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error:', err);
    }
  };

  const toggleIssue = (id) => {
    setSelectedIssues(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const applyCleanup = async () => {
    setLoading(true);
    setLoadingMessage('Applying cleaning operations...');
    setError(null);

    try {
      const selectedIds = Object.keys(selectedIssues)
        .filter(id => selectedIssues[id])
        .map(id => parseInt(id));

      const cleanResponse = await fetch(`${API_BASE_URL}/clean/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_issues: selectedIds
        }),
      });

      if (!cleanResponse.ok) {
        throw new Error('Failed to clean data');
      }

      const cleanData = await cleanResponse.json();
      setCleanedData(cleanData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error:', err);
    }
  };

  const downloadFile = async (format) => {
    try {
      setLoading(true);
      setLoadingMessage(`Preparing ${format} download...`);

      const response = await fetch(`${API_BASE_URL}/download/${fileId}/${format.toLowerCase()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download ${format}`);
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `cleaned_data.${format.toLowerCase()}`;
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
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
      console.error('Error:', err);
    }
  };

  const resetTool = () => {
    setFile(null);
    setFileId(null);
    setPreview(null);
    setAnalysis(null);
    setCleanedData(null);
    setSelectedIssues({});
    setError(null);
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'high': return <XCircle className="w-5 h-5" />;
      case 'medium': return <AlertCircle className="w-5 h-5" />;
      case 'low': return <Eye className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-red-400 italic">empty</span>;
    }
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧠 AI Data Cleaning Tool
          </h1>
          <p className="text-gray-600">Upload messy data, get clean results in seconds</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-semibold">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!file && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer hover:border-blue-500 transition-colors">
              <Upload className="w-16 h-16 text-gray-400 mb-4" />
              <span className="text-xl font-semibold text-gray-700 mb-2">
                Drop your file here or click to browse
              </span>
              <span className="text-sm text-gray-500">
                Supports CSV and XLSX files (up to 10MB)
              </span>
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{loadingMessage}</p>
          </div>
        )}

        {/* Preview Section */}
        {preview && !loading && !cleanedData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Data Preview</h2>
            <div className="text-sm text-gray-600 mb-4">
              Showing first {preview?.rows?.length ?? 0} rows of {analysis?.stats?.total_rows ?? preview?.rows?.length ?? 0} total rows
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {(preview?.columns || []).map((col, i) => (
                      <th key={i} className="px-4 py-2 text-left font-semibold text-gray-700 border">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(preview?.rows || []).map((row, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 text-gray-600 border">
                          {renderValue(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis & Issues */}
        {analysis && !cleanedData && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">🔍 Issues Found</h2>
              <div className="text-sm text-gray-600">
                {analysis?.stats?.total_rows ?? 0} rows × {analysis?.stats?.total_columns ?? 0} columns
              </div>
            </div>

            {(analysis?.issues?.length ?? 0) === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700">Your data looks great!</p>
                <p className="text-gray-600">No issues detected.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {(analysis?.issues || []).map(issue => (
                    <div
                      key={issue.id}
                      className={`border rounded-lg p-4 transition-all ${
                        selectedIssues[issue.id] ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`p-2 rounded-lg ${getSeverityColor(issue.severity)}`}>
                            {getSeverityIcon(issue.severity)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">{issue.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                            {issue.examples?.length > 0 && (
                              <div className="text-xs text-gray-500 mb-2">
                                Examples: {issue.examples.join(', ')}
                              </div>
                            )}
                            {issue.suggestion && (
                              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                💡 {issue.suggestion}
                              </div>
                            )}
                            {issue.suggestions?.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {issue.suggestions.map((s, i) => (
                                  <div key={i} className="text-xs text-gray-600">
                                    {s.from} → <span className="font-semibold text-green-600">{s.to}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {issue.columns && (
                              <div className="text-xs text-gray-500 mt-2">
                                Affected columns: {Array.isArray(issue.columns) ? issue.columns.join(', ') : Object.keys(issue.columns).join(', ')}
                              </div>
                            )}
                            {issue.ai_suggestion && (
                              <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                                🤖 AI: {issue.ai_suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                        <label className="flex items-center cursor-pointer ml-4">
                          <input
                            type="checkbox"
                            checked={selectedIssues[issue.id] || false}
                            onChange={() => toggleIssue(issue.id)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={applyCleanup}
                  disabled={Object.values(selectedIssues).filter(Boolean).length === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    Apply Selected Fixes ({Object.values(selectedIssues).filter(Boolean).length})
                  </span>
                </button>
              </>
            )}

            <button
              onClick={resetTool}
              className="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Upload Different File
            </button>
          </div>
        )}

        {/* Cleaned Data Result */}
        {cleanedData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">✨ Data Cleaned!</h2>
                {cleanedData?.cleaned_filename && (
                  <div className="mb-3 text-sm">
                    <span className="text-gray-600">Saved as: </span>
                    <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
                      {cleanedData.cleaned_filename}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>✓ {cleanedData?.changes?.rows_removed ?? 0} rows removed</span>
                  <span>✓ {cleanedData?.changes?.values_fixed ?? 0} values fixed</span>
                  <span>✓ {cleanedData?.changes?.columns_renamed ?? 0} columns renamed</span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {cleanedData?.stats?.cleaned_rows ?? 0} rows × {cleanedData?.preview?.columns?.length ?? 0} columns
                </div>
              </div>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-100">
                    {(cleanedData?.preview?.columns || []).map((col, i) => (
                      <th key={i} className="px-4 py-2 text-left font-semibold text-gray-700 border">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(cleanedData?.preview?.rows || []).map((row, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 text-gray-600 border">
                          {renderValue(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Download Cleaned Data:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => downloadFile('csv')}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => downloadFile('xlsx')}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => downloadFile('json')}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FileJson className="w-5 h-5" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => downloadFile('sql')}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Database className="w-5 h-5" />
                  <span>SQL</span>
                </button>
              </div>
              {cleanedData.cleaned_filename && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  File will be downloaded with the cleaned filename
                </p>
              )}
            </div>

            <button
              onClick={resetTool}
              className="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Clean Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataCleaningTool;