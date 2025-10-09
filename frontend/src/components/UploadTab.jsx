import React from 'react';
import * as XLSX from 'xlsx';
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
  // Only set preview from local file, do not upload yet
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setLoading(true);
    setLoadingMessage('Reading file...');

    const fileName = uploadedFile.name.toLowerCase();
    const reader = new FileReader();
    reader.onload = (event) => {
      let columns = [];
      let rows = [];
      try {
        if (fileName.endsWith('.csv')) {
          // Parse CSV
          const text = event.target.result;
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length > 0) {
            columns = lines[0].split(',');
            rows = lines.slice(1).map(line => line.split(','));
          }
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          // Parse XLSX/XLS using SheetJS
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (json.length > 0) {
            columns = json[0];
            rows = json.slice(1);
          }
        } else {
          columns = ['Preview not available'];
          rows = [['Unsupported file type']];
        }
      } catch (err) {
        columns = ['Error'];
        rows = [[err.message]];
      }
      setPreview({ columns, rows });
      setLoading(false);
    };
    if (fileName.endsWith('.csv')) {
      reader.readAsText(uploadedFile);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      reader.readAsArrayBuffer(uploadedFile);
    } else {
      setPreview({ columns: ['Preview not available'], rows: [['Unsupported file type']] });
      setLoading(false);
    }
  };

  // Upload file and start analysis when user clicks 'Process file'
  const submitForProcessing = async () => {
    if (!file) return setError('No uploaded file to process');

    setLoading(true);
    setLoadingMessage('Uploading and analyzing file...');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      const uploadData = await uploadResponse.json();
      setFileId(uploadData.file_id);

      // Optionally update preview with backend data
      const rawPreview = uploadData.preview;
      let columns = [];
      if (uploadData.stats?.columns && uploadData.stats.columns.length > 0) {
        columns = uploadData.stats.columns;
      } else if (Array.isArray(rawPreview) && rawPreview.length > 0) {
        columns = Object.keys(rawPreview[0]);
      }
      const rows = Array.isArray(rawPreview)
        ? rawPreview.map(r => columns.map(c => (r[c] !== undefined ? r[c] : '')))
        : [];
      setPreview({ columns, rows });

      // Now analyze
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

  // Handler to re-upload file (go back to FileUpload page)
  const handleReupload = () => {
    setFile(null);
    setFileId(null);
    setPreview(null);
    setAnalysis(null);
    setCleanedData(null);
    setSelectedIssues({});
    setError(null);
  };

  return (
    <>
      {preview && !analysis && (
        <DataPreview 
          preview={preview} 
          analysis={analysis}
          onProcess={submitForProcessing}
          onReupload={handleReupload}
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