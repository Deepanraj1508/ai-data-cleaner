import React, { useState, useMemo } from 'react';
import DataTable from '../common/DataTable';

const DataPreview = ({ preview, analysis, onProcess }) => {
  const DEFAULT_ROWS = 20;
  const [showAll, setShowAll] = useState(false);

  // preview may be either:
  // - an array of record objects (backend upload/clean returns list of objects)
  // - an object { columns: [...], rows: [[...],[...]] }
  const { columns: normalizedColumns, rows: normalizedRows } = useMemo(() => {
    if (!preview) return { columns: [], rows: [] };

    // If preview is already normalized
    if (preview.columns && preview.rows) {
      return { columns: preview.columns, rows: preview.rows };
    }

    // If preview is an array of record objects
    if (Array.isArray(preview)) {
      const cols = preview.length > 0 ? Object.keys(preview[0]) : [];
      const rows = preview.map(r => cols.map(c => (r[c] !== undefined ? r[c] : '')));
      return { columns: cols, rows };
    }

    // Unknown shape
    return { columns: [], rows: [] };
  }, [preview]);

  const totalRows = analysis?.stats?.total_rows ?? (normalizedRows?.length ?? 0);

  const visibleRows = useMemo(() => {
    if (!normalizedRows) return [];
    return showAll ? normalizedRows : normalizedRows.slice(0, DEFAULT_ROWS);
  }, [normalizedRows, showAll]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📊 Data Preview
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            Showing {visibleRows.length} of {totalRows} rows
          </div>
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setShowAll(s => !s)}
          >
            {showAll ? 'Show 20' : 'Show full'}
          </button>
          {onProcess && (
            <button
              className="ml-2 bg-green-600 text-white px-8 py-2 rounded-lg text-large font-semibold hover:bg-green-700 transition-colors shadow-md"
              onClick={onProcess}
            >
              Process file
            </button>
          )}
        </div>
      </div>

      {normalizedColumns.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No preview available</div>
      ) : (
        <DataTable 
          columns={normalizedColumns} 
          rows={visibleRows} 
          className="rounded-lg overflow-hidden border border-gray-200" 
        />
      )}
    </div>
  );
};

export default DataPreview;