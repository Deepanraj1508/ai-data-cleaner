import React, { useState, useEffect } from 'react';
import { Upload, History } from 'lucide-react';
import UploadTab from './components/UploadTab';
import HistoryTab from './components/HistoryTab';
import ErrorMessage from './components/common/ErrorMessage';

const DataCleaningTool = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [cleanedData, setCleanedData] = useState(null);
  const [selectedIssues, setSelectedIssues] = useState({});
  const [error, setError] = useState(null);

  const resetTool = () => {
    setFile(null);
    setFileId(null);
    setPreview(null);
    setAnalysis(null);
    setCleanedData(null);
    setSelectedIssues({});
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            📊 Data Cleaning Tool
          </h1>
          <p className="text-gray-600 text-lg">Transform messy data into pristine datasets with intelligent cleaning</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md p-2 mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'upload' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload & Clean
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="w-5 h-5" />
            History
          </button>
        </div>

        {/* Error Message */}
        {error && <ErrorMessage error={error} />}

        {/* Tab Content */}
        {activeTab === 'upload' ? (
          <UploadTab
            file={file}
            setFile={setFile}
            fileId={fileId}
            setFileId={setFileId}
            preview={preview}
            setPreview={setPreview}
            analysis={analysis}
            setAnalysis={setAnalysis}
            loading={loading}
            setLoading={setLoading}
            loadingMessage={loadingMessage}
            setLoadingMessage={setLoadingMessage}
            cleanedData={cleanedData}
            setCleanedData={setCleanedData}
            selectedIssues={selectedIssues}
            setSelectedIssues={setSelectedIssues}
            setError={setError}
            resetTool={resetTool}
          />
        ) : (
          <HistoryTab />
        )}
      </div>
    </div>
  );
};

export default DataCleaningTool;