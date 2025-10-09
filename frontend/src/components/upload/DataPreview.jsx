import React, { useState, useMemo } from 'react';
import DataTable from '../common/DataTable';

const DataPreview = ({ preview, analysis, onProcess, onReupload }) => {
  const DEFAULT_ROWS = 20;
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);

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

  const totalPages = showAll ? 1 : Math.ceil((normalizedRows?.length ?? 0) / DEFAULT_ROWS);
  const visibleRows = useMemo(() => {
    if (!normalizedRows) return [];
    if (showAll) return normalizedRows;
    const start = (page - 1) * DEFAULT_ROWS;
    return normalizedRows.slice(start, start + DEFAULT_ROWS);
  }, [normalizedRows, showAll, page]);

  // Reset page to 1 if showAll toggled or preview changes
  React.useEffect(() => { setPage(1); }, [showAll, preview]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📊 Data Preview
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {showAll
              ? `Showing all ${totalRows} rows`
              : `Showing ${(page - 1) * DEFAULT_ROWS + 1}-${Math.min(page * DEFAULT_ROWS, totalRows)} of ${totalRows} rows`}
          </div>
          
          {onProcess && (
            <button
              className="ml-2 bg-green-600 text-white px-8 py-2 rounded-lg text-large font-semibold hover:bg-green-700 transition-colors shadow-md"
              onClick={onProcess}
            >
              Process file
            </button>
          )}
          {onReupload && (
            <button
              className="ml-2 bg-yellow-500 text-white px-6 py-2 rounded-lg text-large font-semibold hover:bg-yellow-600 transition-colors shadow-md"
              onClick={onReupload}
            >
              Re-upload File
            </button>
          )}
        </div>
      </div>

      {normalizedColumns.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No preview available</div>
      ) : (
        <>
          <DataTable 
            columns={normalizedColumns} 
            rows={visibleRows} 
            className="rounded-lg overflow-hidden border border-gray-200" 
          />
          {!showAll && totalPages > 1 && (
            <div className="flex justify-end items-center gap-2 mt-4">
              <button
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataPreview;