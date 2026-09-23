import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FilterDeleteModal } from '../components/FilterDeleteModal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Shield, 
  Briefcase, 
  GraduationCap, 
  Plus, 
  FileSpreadsheet, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  CheckCircle2, 
  X,
  PieChart as PieIcon,
  TrendingUp,
  Filter
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchStudent, setSearchStudent] = useState('');

  // Filter Delete Modal
  const [showFilterDeleteModal, setShowFilterDeleteModal] = useState(false);

  // Add Coordinator Modal
  const [showCoordModal, setShowCoordModal] = useState(false);
  const [coordUsername, setCoordUsername] = useState('');
  const [coordEmail, setCoordEmail] = useState('');
  const [coordEmpId, setCoordEmpId] = useState('');
  const [coordName, setCoordName] = useState('');
  const [coordDept, setCoordDept] = useState('');

  // Add Student Modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [stRegId, setStRegId] = useState('');
  const [stName, setStName] = useState('');
  const [stEmail, setStEmail] = useState('');
  const [stBranch, setStBranch] = useState('MCA');
  const [stCgpa, setStCgpa] = useState('8.50');
  const [stPassout, setStPassout] = useState('2027');
  const [stBacklogs, setStBacklogs] = useState('0');
  const [stGap, setStGap] = useState('0');

  // Bulk Upload Student Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);

  const [toast, setToast] = useState('');
  
  // Multi-select state for bulk student deletion
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map(s => s.student_id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedStudentIds.length} selected student(s)?`)) return;

    try {
      await api.post('/admin/students/bulk-delete/', { student_ids: selectedStudentIds });
      showToast(`Successfully deleted ${selectedStudentIds.length} student record(s).`);
      setSelectedStudentIds([]);
      fetchAdminData();
    } catch (err) {
      showToast('Failed to delete selected students.');
    }
  };

  const getErrorMessage = (err, defaultMsg) => {
    if (!err.response?.data) return defaultMsg;
    const data = err.response.data;
    if (typeof data === 'string') return data;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        const field = keys[0];
        const val = data[field];
        const msg = Array.isArray(val) ? val.join(', ') : val;
        return `${field.replace('_', ' ')}: ${msg}`;
      }
    }
    return defaultMsg;
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, coordRes, studRes] = await Promise.all([
        api.get('/admin/analytics/'),
        api.get('/admin/coordinators/'),
        api.get('/admin/students/')
      ]);
      setAnalytics(analyticsRes.data);
      setCoordinators(coordRes.data);
      setStudents(studRes.data);
    } catch (err) {
      console.error('Failed to load super admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coordinators/', {
        username: coordUsername,
        email: coordEmail,
        password: 'Coord@123',
        employee_id: coordEmpId,
        name: coordName,
        department: coordDept
      });
      showToast('Placement Coordinator account created successfully!');
      setShowCoordModal(false);
      setCoordUsername('');
      setCoordEmail('');
      setCoordEmpId('');
      setCoordName('');
      setCoordDept('');
      fetchAdminData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to create coordinator.'));
    }
  };

  const handleDeleteCoordinator = async (coordId) => {
    if (!window.confirm('Delete coordinator account?')) return;
    try {
      await api.delete(`/admin/coordinators/${coordId}/`);
      showToast('Coordinator deleted successfully.');
      fetchAdminData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete coordinator.'));
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/students/', {
        username: stRegId,
        email: stEmail,
        password: 'Student@123',
        registration_id: stRegId,
        name: stName,
        branch: stBranch,
        cgpa: parseFloat(stCgpa),
        passout_year: parseInt(stPassout),
        active_backlogs: parseInt(stBacklogs) || 0,
        career_gap_months: parseInt(stGap) || 0
      });
      showToast('Student profile created successfully!');
      setShowStudentModal(false);
      setStRegId('');
      setStName('');
      setStEmail('');
      fetchAdminData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to create student.'));
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Delete student record?')) return;
    try {
      await api.delete(`/admin/students/${studentId}/`);
      showToast('Student record deleted.');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to delete student.');
    }
  };

  const handleBulkImportStudents = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;

    const formData = new FormData();
    formData.append('excel_file', bulkFile);

    setUploadingBulk(true);
    setBulkResult(null);

    try {
      const res = await api.post('/admin/bulk-upload-students/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBulkResult(res.data);
      showToast('Bulk student import completed!');
      fetchAdminData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Bulk import failed.');
    } finally {
      setUploadingBulk(false);
    }
  };

  const downloadStudentTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,registration_id,name,email,branch,cgpa,passout_year,active_backlogs,career_gap_months\n25C300001,Amit Kumar,amit@student.edu,MCA,8.50,2027,0,0\n25C300002,Priya Das,priya@student.edu,CSE,9.10,2027,0,0\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Student_Bulk_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.registration_id.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.branch.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-blue-600 text-white font-semibold shadow-xl shadow-blue-500/20 flex items-center gap-3 animate-bounce text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="card-clean p-7 border-slate-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" /> Super Admin Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">System-wide recruitment drive analytics, coordinator accounts, and student roster management.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilterDeleteModal(true)}
            className="btn-secondary py-2.5 px-4 text-xs font-bold text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100"
          >
            <Filter className="w-4 h-4 text-rose-600" />
            <span>Purge Students by Filter</span>
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="btn-secondary py-2.5 px-4 text-xs font-bold text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            <span>Bulk Import Students</span>
          </button>

          <button
            onClick={() => setShowCoordModal(true)}
            className="btn-primary py-2.5 px-4 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Coordinator</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card-clean p-5 bg-blue-50/50 border-blue-200/80">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Registered Students</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 font-heading">{analytics.overview?.total_students}</h3>
          </div>

          <div className="card-clean p-5 bg-sky-50/50 border-sky-200/80">
            <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Placement Coordinators</p>
            <h3 className="text-3xl font-extrabold text-sky-900 mt-1 font-heading">{analytics.overview?.total_coordinators}</h3>
          </div>

          <div className="card-clean p-5 bg-indigo-50/50 border-indigo-200/80">
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Active Placement Drives</p>
            <h3 className="text-3xl font-extrabold text-indigo-900 mt-1 font-heading">{analytics.overview?.total_jobs}</h3>
          </div>

          <div className="card-clean p-5 bg-emerald-50/50 border-emerald-200/80">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Offers Received</p>
            <h3 className="text-3xl font-extrabold text-emerald-900 mt-1 font-heading">{analytics.overview?.selected_students}</h3>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Drive Analytics
        </button>

        <button
          onClick={() => setActiveTab('coordinators')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'coordinators'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Placement Coordinators ({coordinators.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'students'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Student Roster ({students.length})
        </button>
      </div>

      {/* Tab 1: Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Branch Statistics */}
          <div className="card-clean p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Branch-Wise Placement Stats
            </h3>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.branch_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="branch" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                  <Bar dataKey="students" fill="#2563eb" name="Total Students" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="selected" fill="#10b981" name="Placed Students" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: System Activity Overview */}
          <div className="card-clean p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-blue-600" /> Application Status Summary
            </h3>
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Total Applications Submitted</span>
                <span className="font-bold text-slate-900">{analytics.overview?.total_applications}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="font-semibold text-blue-800">In Progress Applications</span>
                <span className="font-bold text-blue-700">{analytics.overview?.in_progress_applications}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-semibold text-emerald-800">Final Offers Selected</span>
                <span className="font-bold text-emerald-700">{analytics.overview?.selected_students}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                <span className="font-semibold text-rose-800">Rejected Applications</span>
                <span className="font-bold text-rose-700">{analytics.overview?.rejected_applications}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Placement Coordinators Management */}
      {activeTab === 'coordinators' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Placement Coordinators List</h3>
            <button onClick={() => setShowCoordModal(true)} className="btn-primary py-2 px-3.5 text-xs font-bold">
              <Plus className="w-4 h-4" /> Create Coordinator
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coordinators.map((coord) => (
              <div key={coord.coordinator_id} className="card-clean p-5 flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-heading">{coord.name}</h4>
                  <p className="text-xs font-bold text-blue-600">{coord.department}</p>
                  <p className="text-xs text-slate-500 mt-1">Emp ID: <span className="text-slate-800 font-semibold">{coord.employee_id}</span> • Email: <span className="text-slate-800 font-semibold">{coord.email}</span></p>
                </div>

                <button
                  onClick={() => handleDeleteCoordinator(coord.coordinator_id)}
                  className="btn-secondary py-1.5 px-3 text-xs text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100"
                  title="Revoke Coordinator Access"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Student Roster Management */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Search students by name, reg ID, branch..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilterDeleteModal(true)}
                className="btn-secondary py-2.5 px-3.5 text-xs text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 font-bold flex items-center gap-1.5"
                title="Batch delete students by Branch, Passout Year, or Academic criteria"
              >
                <Filter className="w-4 h-4 text-rose-600" />
                Purge by Filter
              </button>
              {selectedStudentIds.length > 0 && (
                <button
                  onClick={handleBulkDeleteStudents}
                  className="btn-secondary py-2.5 px-3.5 text-xs text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Delete Selected ({selectedStudentIds.length})
                </button>
              )}
              <button onClick={() => setShowBulkModal(true)} className="btn-secondary py-2.5 px-3.5 text-xs text-sky-700 bg-sky-50 border-sky-200 font-semibold">
                <FileSpreadsheet className="w-4 h-4 text-sky-600" /> Excel Bulk Import
              </button>
              <button onClick={() => setShowStudentModal(true)} className="btn-primary py-2.5 px-3.5 text-xs font-bold">
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="card-clean overflow-x-auto border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Registration ID</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">CGPA</th>
                  <th className="p-3">Passout Year</th>
                  <th className="p-3">Backlogs</th>
                  <th className="p-3">Career Gap</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((st) => {
                  const isSelected = selectedStudentIds.includes(st.student_id);
                  return (
                    <tr key={st.student_id} className={`hover:bg-slate-50 ${isSelected ? 'bg-blue-50/40' : ''}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(st.student_id)}
                        />
                      </td>
                      <td className="p-3 font-bold text-slate-900">{st.name}</td>
                      <td className="p-3 font-mono font-semibold text-blue-600">{st.registration_id}</td>
                      <td className="p-3 text-slate-600 font-medium">{st.branch}</td>
                      <td className="p-3 font-bold text-emerald-700">{st.cgpa}</td>
                      <td className="p-3 text-slate-600">{st.passout_year}</td>
                      <td className="p-3 text-amber-700 font-bold">{st.active_backlogs}</td>
                      <td className="p-3 text-purple-700 font-bold">{st.career_gap_months || 0} mo</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteStudent(st.student_id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create Coordinator */}
      {showCoordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold text-slate-900 mb-4 font-heading">Create Placement Coordinator Account</h3>
            <form onSubmit={handleCreateCoordinator} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. coord3"
                  value={coordUsername}
                  onChange={(e) => setCoordUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. EMP103"
                  value={coordEmpId}
                  onChange={(e) => setCoordEmpId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Prof. R. K. Mishra"
                  value={coordName}
                  onChange={(e) => setCoordName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Training & Placement Cell / MCA Dept"
                  value={coordDept}
                  onChange={(e) => setCoordDept(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="coord@placementpoint.edu"
                  value={coordEmail}
                  onChange={(e) => setCoordEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCoordModal(false)} className="btn-secondary py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 px-4 font-bold">
                  Create Coordinator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Single Student */}
      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold text-slate-900 mb-4 font-heading">Add Single Student Record</h3>
            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Registration ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 25C216A05"
                    value={stRegId}
                    onChange={(e) => setStRegId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ananya Das"
                    value={stName}
                    onChange={(e) => setStName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Branch</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="MCA / CSE / IT"
                    value={stBranch}
                    onChange={(e) => setStBranch(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={stCgpa}
                    onChange={(e) => setStCgpa(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={stBacklogs}
                    onChange={(e) => setStBacklogs(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Career Gap (Months)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={stGap}
                    onChange={(e) => setStGap(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="student@student.edu"
                  value={stEmail}
                  onChange={(e) => setStEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowStudentModal(false)} className="btn-secondary py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 px-4 font-bold">
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Bulk Student Excel Upload */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold text-slate-900 mb-4 font-heading">Bulk Import Student Roster (CSV / Excel)</h3>
            <form onSubmit={handleBulkImportStudents} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 font-semibold flex items-center justify-between">
                <span>Download Sample Student CSV Template</span>
                <button
                  type="button"
                  onClick={downloadStudentTemplate}
                  className="btn-secondary py-1 px-2.5 text-[11px] text-sky-800 bg-white border-sky-300 hover:bg-sky-100"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>

              <div>
                <label className="form-label">Select Roster File (.xlsx, .csv)</label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="form-input"
                  onChange={(e) => setBulkFile(e.target.files[0])}
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Columns: registration_id, name, email, branch, cgpa, passout_year. Optional: active_backlogs (or backlog/backlogs), career_gap_months (or gap).</p>
              </div>

              {bulkResult && (
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 space-y-1 text-slate-700 font-semibold">
                  <p className="text-emerald-700 font-bold">{bulkResult.message}</p>
                  <p>Created Student Accounts: {bulkResult.created}</p>
                  <p>Skipped / Existing Records: {bulkResult.skipped}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowBulkModal(false)} className="btn-secondary py-2 px-4">
                  Close
                </button>
                <button type="submit" disabled={uploadingBulk} className="btn-primary py-2 px-4 font-bold bg-sky-600 hover:bg-sky-700">
                  <Upload className="w-4 h-4" />
                  {uploadingBulk ? 'Importing Roster...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter-Based Batch Delete Modal */}
      <FilterDeleteModal
        isOpen={showFilterDeleteModal}
        onClose={() => setShowFilterDeleteModal(false)}
        onSuccess={(msg) => {
          showToast(msg);
          fetchAdminData();
        }}
      />
    </div>
  );
};
