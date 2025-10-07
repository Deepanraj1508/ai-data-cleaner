import React from 'react';
import { Upload, CheckCircle, Loader } from 'lucide-react';
import FileUpload from './upload/FileUpload';
import DataPreview from './upload/DataPreview';
import IssuesSection from './upload/IssuesSection';
import CleanedDataView from './upload/CleanedDataView';
import { API_BASE_URL } from '../config';

const UploadTab = ({
  file,
  setFile,
  fileId,
  setFileId,
  preview,
  setPreview,
  analysis,
  setAnalysis,
  loading,
  setLoading,
  loadingMessage,
  setLoadingMessage,
  cleanedData,
  setCleanedData,
  selectedIssues,
  setSelectedIssues,
  setError,
  resetTool
}) => {
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setLoadingMessage('Uploading and analyzing file...');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      const uploadData = await uploadResponse.json();
      setFileId(uploadData.file_id);
      setPreview(uploadData.preview);

      setLoadingMessage('AI is analyzing your data...');
      const analysisResponse = await fetch(`${API_BASE_URL}/analyze/${uploadData.file_id}`, {
        method: 'POST',
      });

      if (!analysisResponse.ok) throw new Error('Failed to analyze data');

      const analysisData = await analysisResponse.json();
      setAnalysis(analysisData);

      const initialSelected = {};
      (analysisData.issues || []).forEach(issue => {
        initialSelected[issue.id] = true;
      });
      setSelectedIssues(initialSelected);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_issues: selectedIds }),
      });

      if (!cleanResponse.ok) throw new Error('Failed to clean data');

      const cleanData = await cleanResponse.json();
      setCleanedData(cleanData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleIssue = (id) => {
    setSelectedIssues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!file) {
    return <FileUpload onFileUpload={handleFileUpload} />;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{loadingMessage}</p>
      </div>
    );
  }

  if (cleanedData) {
    return (
      <CleanedDataView 
        cleanedData={cleanedData} 
        fileId={fileId}
        resetTool={resetTool}
        setLoading={setLoading}
        setLoadingMessage={setLoadingMessage}
        setError={setError}
      />
    );
  }

  return (
    <>
      {preview && (
        <DataPreview 
          preview={preview} 
          analysis={analysis} 
        />
      )}

      {analysis && (
        <IssuesSection
          analysis={analysis}
          selectedIssues={selectedIssues}
          toggleIssue={toggleIssue}
          applyCleanup={applyCleanup}
          resetTool={resetTool}
        />
      )}
    </>
  );
};

export default UploadTab;