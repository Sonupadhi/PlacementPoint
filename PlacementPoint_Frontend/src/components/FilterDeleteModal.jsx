import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Filter, Trash2, AlertTriangle, X, CheckCircle, RefreshCw } from 'lucide-react';

export const FilterDeleteModal = ({ isOpen, onClose, onSuccess }) => {
  const [branch, setBranch] = useState('ALL');
  const [passoutYear, setPassoutYear] = useState('ALL');
  const [minBacklogs, setMinBacklogs] = useState('ALL');
  const [maxCgpa, setMaxCgpa] = useState('ALL');

  const [matchingCount, setMatchingCount] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchMatchingCount = async () => {
    if (!isOpen) return;
    setCalculating(true);
    setError('');
    try {
      const res = await api.post('/admin/students/filter-delete/', {
        branch,
        passout_year: passoutYear,
        min_backlogs: minBacklogs,
        max_cgpa: maxCgpa,
        preview: true
      });
      setMatchingCount(res.data.matching_count);
    } catch (err) {
      console.error('Failed to preview matching student count:', err);
      setMatchingCount(0);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMatchingCount();
    }
  }, [isOpen, branch, passoutYear, minBacklogs, maxCgpa]);

  if (!isOpen) return null;

  const handleResetFilters = () => {
    setBranch('ALL');
    setPassoutYear('ALL');
    setMinBacklogs('ALL');
    setMaxCgpa('ALL');
    setError('');
  };

  const handleExecuteFilterDelete = async () => {
    if (matchingCount === 0 || matchingCount === null) return;

    const confirmMsg = `WARNING: Are you sure you want to permanently delete ${matchingCount} student record(s) matching your filter settings?\n\n` +
      `• Branch: ${branch}\n` +
      `• Batch: ${passoutYear}\n` +
      `• Backlogs: ${minBacklogs === '1' ? '>= 1 Active Backlog' : 'All'}\n` +
      `• CGPA Threshold: ${maxCgpa === 'ALL' ? 'All' : '<= ' + maxCgpa}`;

    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);
    setError('');

    try {
      const res = await api.post('/admin/students/filter-delete/', {
        branch,
        passout_year: passoutYear,
        min_backlogs: minBacklogs,
        max_cgpa: maxCgpa,
        preview: false
      });
      onSuccess(res.data.message || `Successfully deleted ${matchingCount} student records.`);
      handleResetFilters();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete students matching filter.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-heading">Filter-Based Batch Deletion</h3>
            <p className="text-xs text-slate-500 mt-0.5">Purge student records by Branch, Passout Year, or Academic criteria.</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Filter Controls Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Target Branch</label>
              <select
                className="form-input"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="ALL">All Branches</option>
                <option value="MCA">MCA</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            </div>

            <div>
              <label className="form-label">Passout / Batch Year</label>
              <select
                className="form-input"
                value={passoutYear}
                onChange={(e) => setPassoutYear(e.target.value)}
              >
                <option value="ALL">All Batches</option>
                <option value="2024">2024 Batch</option>
                <option value="2025">2025 Batch</option>
                <option value="2026">2026 Batch</option>
                <option value="2027">2027 Batch</option>
                <option value="2028">2028 Batch</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Backlogs Filter</label>
              <select
                className="form-input"
                value={minBacklogs}
                onChange={(e) => setMinBacklogs(e.target.value)}
              >
                <option value="ALL">All Students</option>
                <option value="1">Active Backlogs (&gt;= 1)</option>
              </select>
            </div>

            <div>
              <label className="form-label">CGPA Threshold</label>
              <select
                className="form-input"
                value={maxCgpa}
                onChange={(e) => setMaxCgpa(e.target.value)}
              >
                <option value="ALL">All CGPA Scores</option>
                <option value="6.0">Below 6.0 CGPA (&lt;= 6.0)</option>
                <option value="7.0">Below 7.0 CGPA (&lt;= 7.0)</option>
                <option value="8.0">Below 8.0 CGPA (&lt;= 8.0)</option>
              </select>
            </div>
          </div>

          {/* Live Preview Match Counter Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  {calculating ? (
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Calculating matching records...
                    </span>
                  ) : (
                    <span>Found <span className="text-rose-600 font-extrabold text-sm">{matchingCount ?? 0}</span> matching student record(s)</span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 block">Records will be permanently deleted upon execution.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Reset
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3 text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteFilterDelete}
              disabled={deleting || calculating || matchingCount === 0 || matchingCount === null}
              className="btn-secondary flex-1 py-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed border-rose-600"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : `Delete ${matchingCount ?? 0} Filtered Students`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
