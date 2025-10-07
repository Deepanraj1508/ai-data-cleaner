import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, History as HistoryIcon } from 'lucide-react';
import HistoryItem from './history/HistoryItem';
import FileDetailsModal from './history/FileDetailsModal';
import { API_BASE_URL } from '../config';

const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchFileDetails = async (record) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/file/${record.file_id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRecord(data);
      } else {
        setSelectedRecord(record);
      }
      setLoading(false);
    } catch (err) {
      setSelectedRecord(record);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="w-7 h-7" />
          Processing History
        </h2>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <HistoryIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500">No files processed yet</p>
          <p className="text-sm text-gray-400 mt-2">Upload a file to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((record) => (
            <HistoryItem
              key={record.file_id}
              record={record}
              onClick={fetchFileDetails}
            />
          ))}
        </div>
      )}

      {selectedRecord && (
        <FileDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

export default HistoryTab;