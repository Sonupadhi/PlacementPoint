import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FilterDeleteModal } from '../components/FilterDeleteModal';
import { ProgressBar } from '../components/ProgressBar';
import { 
  Briefcase, 
  Plus, 
  FileSpreadsheet, 
  Trash2, 
  Building, 
  Users, 
  CheckCircle2, 
  Upload, 
  Download, 
  Bell, 
  X,
  Layers,
  ExternalLink,
  Pencil,
  GraduationCap,
  Search,
  Filter
} from 'lucide-react';

export const CoordinatorDashboard = () => {
  const [activeTab, setActiveTab] = useState('drives');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Delete Modal
  const [showFilterDeleteModal, setShowFilterDeleteModal] = useState(false);

  // Bulk Student Upload Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);

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

  // Create/Edit Job Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [description, setDescription] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [maxBacklogs, setMaxBacklogs] = useState('');
  const [maxGap, setMaxGap] = useState('');
  const [allowedBranches, setAllowedBranches] = useState('');
  const [passoutYear, setPassoutYear] = useState('2027');
  const [deadline, setDeadline] = useState('');
  const [stages, setStages] = useState(['Online Assessment', 'Technical Interview', 'HR Interview']);
  const [newStageInput, setNewStageInput] = useState('');
  const [submittingJob, setSubmittingJob] = useState(false);

  // Bulk Shortlist Modal
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [targetStageOrder, setTargetStageOrder] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Publish Notice Modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeBranch, setNoticeBranch] = useState('ALL');

  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchJobs = async (selectJobId = null) => {
    setLoading(true);
    try {
      const [jobsRes, notifRes, studRes] = await Promise.all([
        api.get('/jobs/'),
        api.get('/notifications/'),
        api.get('/admin/students/')
      ]);
      const fetchedJobs = jobsRes.data || [];
      setJobs(fetchedJobs);
      setNotifications(notifRes.data || []);
      setStudents(studRes.data || []);

      if (selectJobId) {
        const target = fetchedJobs.find(j => j.job_id === selectJobId);
        if (target) fetchApplicants(target);
      } else if (fetchedJobs.length > 0 && !selectedJob) {
        fetchApplicants(fetchedJobs[0]);
      }
      return fetchedJobs;
    } catch (err) {
      console.error('Failed to load coordinator data:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(searchStudent.toLowerCase()) ||
    (s.registration_id || '').toLowerCase().includes(searchStudent.toLowerCase()) ||
    (s.branch || '').toLowerCase().includes(searchStudent.toLowerCase())
  );

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

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Delete student record?')) return;
    try {
      await api.delete(`/admin/students/${studentId}/`);
      showToast('Student record deleted.');
      fetchJobs();
    } catch (err) {
      showToast('Failed to delete student.');
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedStudentIds.length} selected student(s)?`)) return;

    try {
      await api.post('/admin/students/bulk-delete/', { student_ids: selectedStudentIds });
      showToast(`Successfully deleted ${selectedStudentIds.length} student record(s).`);
      setSelectedStudentIds([]);
      fetchJobs();
    } catch (err) {
      showToast('Failed to delete selected students.');
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
      fetchJobs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create student.');
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
      fetchJobs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Bulk import failed.');
    } finally {
      setUploadingBulk(false);
    }
  };

  const fetchApplicants = async (job) => {
    setSelectedJob(job);
    try {
      const res = await api.get(`/applications/job-applications/${job.job_id}/`);
      setApplicants(res.data);
    } catch (err) {
      showToast('Failed to load applicants.');
    }
  };

  const getDriveStageInfo = (job, applicantsList) => {
    if (!job || !job.rounds || job.rounds.length === 0) {
      return { currentRound: null, status: 'IN_PROGRESS' };
    }

    const inProgressApps = applicantsList.filter(a => a.status === 'IN_PROGRESS');
    const selectedApps = applicantsList.filter(a => a.status === 'SELECTED');

    if (inProgressApps.length > 0) {
      let maxOrder = 1;
      let activeRound = job.rounds[0];

      inProgressApps.forEach(a => {
        if (a.current_round && a.current_round.round_order > maxOrder) {
          maxOrder = a.current_round.round_order;
          const match = job.rounds.find(r => r.round_order === maxOrder);
          if (match) activeRound = match;
        }
      });

      return { currentRound: activeRound, status: 'IN_PROGRESS' };
    } else if (selectedApps.length > 0 && applicantsList.length > 0) {
      return { currentRound: job.rounds[job.rounds.length - 1], status: 'SELECTED' };
    } else {
      return { currentRound: job.rounds[0], status: 'IN_PROGRESS' };
    }
  };

  const handleDirectStageUpdate = async (targetStageOrder) => {
    if (!selectedJob) return;
    const targetRoundObj = selectedJob.rounds?.find(r => r.round_order === targetStageOrder);
    const stageName = targetRoundObj 
      ? targetRoundObj.round_name 
      : (targetStageOrder > (selectedJob.rounds?.length || 0) ? 'Final Selection / Hired' : `Stage ${targetStageOrder}`);
    
    if (!window.confirm(`Update hiring process stage for ${selectedJob.company_name} to "${stageName}"?`)) return;

    try {
      const res = await api.post('/applications/update-stage/', {
        job_id: selectedJob.job_id,
        next_stage_order: targetStageOrder
      });
      showToast(res.data?.message || 'Hiring stage updated!');
      fetchApplicants(selectedJob);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update hiring stage.');
    }
  };

  const resetJobForm = () => {
    setEditingJob(null);
    setCompanyName('');
    setRoleTitle('');
    setDescription('');
    setApplyLink('');
    setMinCgpa('');
    setMaxBacklogs('');
    setMaxGap('');
    setAllowedBranches('');
    setPassoutYear('2027');
    setDeadline('');
    setStages(['Online Assessment', 'Technical Interview', 'HR Interview']);
    setNewStageInput('');
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setCompanyName(job.company_name || '');
    setRoleTitle(job.role_title || '');
    setDescription(job.description || '');
    setApplyLink(job.apply_link || '');
    setMinCgpa(job.min_cgpa || '');
    setMaxBacklogs(job.max_backlogs !== undefined ? String(job.max_backlogs) : '');
    setMaxGap(job.max_career_gap_months !== undefined ? String(job.max_career_gap_months) : '');
    setAllowedBranches(job.allowed_branches || '');
    setPassoutYear(job.passout_year ? String(job.passout_year) : '2027');

    if (job.deadline) {
      const d = new Date(job.deadline);
      if (!isNaN(d.getTime())) {
        setDeadline(d.toISOString().split('T')[0]);
      } else {
        setDeadline('');
      }
    } else {
      setDeadline('');
    }

    if (job.rounds && job.rounds.length > 0) {
      setStages(job.rounds.map(r => r.round_name));
    } else {
      setStages(['Online Assessment', 'Technical Interview', 'HR Interview']);
    }

    setShowCreateModal(true);
  };

  const handleAddStage = () => {
    if (newStageInput.trim()) {
      setStages([...stages, newStageInput.trim()]);
      setNewStageInput('');
    }
  };

  const handleRemoveStage = (index) => {
    setStages(stages.filter((_, idx) => idx !== index));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (stages.length === 0) {
      showToast('Please add at least one recruitment round to the pipeline.');
      return;
    }
    setSubmittingJob(true);

    const payload = {
      company_name: companyName,
      role_title: roleTitle,
      description,
      apply_link: applyLink || 'https://placementpoint.edu',
      min_cgpa: parseFloat(minCgpa || 0),
      max_backlogs: parseInt(maxBacklogs || 0),
      max_career_gap_months: parseInt(maxGap || 0),
      allowed_branches: allowedBranches || 'ALL',
      passout_year: parseInt(passoutYear || 2027),
      deadline: deadline && !isNaN(new Date(deadline).getTime())
        ? new Date(deadline).toISOString() 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      stages
    };

    try {
      let res;
      if (editingJob) {
        res = await api.put(`/jobs/${editingJob.job_id}/`, payload);
        showToast('Placement drive updated successfully!');
      } else {
        res = await api.post('/jobs/create/', payload);
        showToast('Job drive created successfully with dynamic hiring rounds!');
      }

      resetJobForm();
      setShowCreateModal(false);
      
      const savedJob = res.data?.job;
      if (savedJob?.job_id) {
        await fetchJobs(savedJob.job_id);
      } else {
        await fetchJobs();
      }
    } catch (err) {
      console.error('Job creation error:', err);
      let errorMsg = 'Failed to create job drive.';
      if (!err.response) {
        errorMsg = 'Network Error: Cannot connect to Backend Server (http://127.0.0.1:8000). Please check if Django is running.';
      } else {
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData?.error) {
          errorMsg = errorData.error;
        } else if (errorData && typeof errorData === 'object') {
          const firstKey = Object.keys(errorData)[0];
          const firstVal = errorData[firstKey];
          errorMsg = `${firstKey}: ${Array.isArray(firstVal) ? firstVal.join(', ') : firstVal}`;
        }
      }
      showToast(errorMsg);
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this placement drive?')) return;
    try {
      await api.delete(`/jobs/${jobId}/`);
      showToast('Job drive deleted successfully.');
      fetchJobs();
      if (selectedJob?.job_id === jobId) setSelectedJob(null);
    } catch (err) {
      showToast('Failed to delete job drive.');
    }
  };

  const handleUploadShortlist = async (e) => {
    e.preventDefault();
    if (!selectedJob || !targetStageOrder || !excelFile) {
      showToast('Please select target stage and upload Excel file.');
      return;
    }

    const formData = new FormData();
    formData.append('job_id', selectedJob.job_id);
    formData.append('next_stage_order', targetStageOrder);
    formData.append('excel_file', excelFile);
    formData.append('mark_rejected', 'true');

    setUploadingExcel(true);
    setUploadResult(null);

    try {
      const res = await api.post('/applications/update-shortlist/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult(res.data);
      showToast('Candidate shortlist updated successfully!');
      fetchApplicants(selectedJob);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to process Excel shortlist.');
    } finally {
      setUploadingExcel(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,registration_id,student_name\n25C216A01,Biswaranjan Padhi\n25C219A58,Satyajit Swain\n25C213A23,Amisha Mohanty\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Shortlist_Template_${selectedJob?.company_name || 'Drive'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePublishNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notifications/', {
        title: noticeTitle,
        message: noticeMessage,
        target_branch: noticeBranch
      });
      showToast('Notice published successfully!');
      setShowNoticeModal(false);
      setNoticeTitle('');
      setNoticeMessage('');
      fetchJobs();
    } catch (err) {
      showToast('Failed to publish notice.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-blue-600 text-white font-semibold shadow-xl shadow-blue-500/20 flex items-center gap-3 animate-bounce text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner Card */}
      <div className="card-clean p-7 border-slate-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Placement Coordinator Control Center</h2>
          <p className="text-xs text-slate-500 mt-1">Post job drives, configure dynamic recruitment rounds, and process bulk candidate shortlist Excels.</p>
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
            onClick={() => setShowNoticeModal(true)}
            className="btn-secondary py-2.5 px-4 text-xs font-bold text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100"
          >
            <Bell className="w-4 h-4 text-sky-600" />
            <span>Publish Notice</span>
          </button>

          <button
            onClick={() => {
              resetJobForm();
              setShowCreateModal(true);
            }}
            className="btn-primary py-2.5 px-4 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Drive</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card-clean p-5 bg-blue-50/50 border-blue-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Posted Job Drives</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1 font-heading">{jobs.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card-clean p-5 bg-sky-50/50 border-sky-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Active Applicants</p>
              <h3 className="text-3xl font-extrabold text-sky-900 mt-1 font-heading">{applicants.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card-clean p-5 bg-indigo-50/50 border-indigo-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Published Notices</p>
              <h3 className="text-3xl font-extrabold text-indigo-900 mt-1 font-heading">{notifications.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Bell className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveTab('drives')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'drives'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Active Placement Drives ({jobs.length})
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

        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'notices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" /> Campus Notices ({notifications.length})
        </button>
      </div>

      {/* Drives Tab */}
      {activeTab === 'drives' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drives List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posted Job Openings</h3>
            {jobs.length === 0 ? (
              <div className="card-clean p-6 text-center text-slate-400">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No placement drives posted yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Click "Post New Drive" above to create your first placement drive.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.job_id}
                  onClick={() => fetchApplicants(job)}
                  className={`card-clean p-4 cursor-pointer transition-all ${
                    selectedJob?.job_id === job.job_id
                      ? 'border-blue-500 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                      : 'hover:border-slate-300'
                  }`}
                >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 font-heading">{job.company_name}</h4>
                    <p className="text-xs text-blue-600 font-bold">{job.role_title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditJob(job); }}
                      className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50"
                      title="Edit Drive Details"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.job_id); }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50"
                      title="Delete Drive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{job.rounds?.length || 0} Stages Pipeline</span>
                  <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            )))}
          </div>

          {/* Applicants & Bulk Excel Shortlist Panel */}
          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="card-clean p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-600" /> {selectedJob.company_name} - {selectedJob.role_title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>Min CGPA: {selectedJob.min_cgpa}</span>
                      <span>•</span>
                      <span>Branches: {selectedJob.allowed_branches}</span>
                      {selectedJob.apply_link && (
                        <>
                          <span>•</span>
                          <a
                            href={selectedJob.apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            <span>Apply Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditJob(selectedJob)}
                      className="btn-secondary py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300"
                      title="Edit Drive Details"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Drive</span>
                    </button>

                    <button
                      onClick={() => setShowShortlistModal(true)}
                      className="btn-primary py-2 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Upload Shortlist Excel</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Recruitment Pipeline Progress Bar */}
                {(() => {
                  const driveInfo = getDriveStageInfo(selectedJob, applicants);
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Drive Recruitment Progress:
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Quick Stage Advance:</span>
                          <select
                            className="form-input text-xs py-1 px-2.5 rounded-xl font-bold bg-white border border-slate-300 text-blue-600 cursor-pointer"
                            value={driveInfo.currentRound?.round_order || 1}
                            onChange={(e) => handleDirectStageUpdate(parseInt(e.target.value))}
                          >
                            {selectedJob.rounds?.map((r) => (
                              <option key={r.round_id} value={r.round_order}>
                                Stage {r.round_order}: {r.round_name}
                              </option>
                            ))}
                            <option value={(selectedJob.rounds?.length || 0) + 1}>
                              Final Selection / Hired
                            </option>
                          </select>
                        </div>
                      </div>

                      <ProgressBar
                        rounds={selectedJob.rounds}
                        currentRound={driveInfo.currentRound}
                        status={driveInfo.status}
                        title={`Ongoing Hiring Process - ${selectedJob.company_name}`}
                        interactive={true}
                        onStageSelect={(round) => handleDirectStageUpdate(round.round_order)}
                        statusBadgeText={`ACTIVE STAGE: ${driveInfo.currentRound?.round_name || 'Applied'}`}
                      />
                    </div>
                  );
                })()}

                {/* Applicants Roster Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Applicant Roster ({applicants.length} Students)
                  </h4>

                  {applicants.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No students have applied to this drive yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Reg ID</th>
                            <th className="p-3">Branch</th>
                            <th className="p-3">CGPA</th>
                            <th className="p-3">Backlogs</th>
                            <th className="p-3">Career Gap</th>
                            <th className="p-3">Current Round</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {applicants.map((app) => (
                            <tr key={app.application_id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">{app.student?.name}</td>
                              <td className="p-3 text-blue-700 font-mono font-semibold">{app.student?.registration_id}</td>
                              <td className="p-3 text-slate-600">{app.student?.branch}</td>
                              <td className="p-3 font-bold text-emerald-700">{app.student?.cgpa}</td>
                              <td className="p-3 text-amber-700 font-bold">{app.student?.active_backlogs ?? 0}</td>
                              <td className="p-3 text-purple-700 font-bold">{app.student?.career_gap_months ?? 0} mo</td>
                              <td className="p-3 text-slate-700 font-medium">{app.current_round?.round_name || 'Applied'}</td>
                              <td className="p-3">
                                <span className={`badge ${
                                  app.status === 'SELECTED' ? 'badge-selected' :
                                  app.status === 'REJECTED' ? 'badge-rejected' : 'badge-in-progress'
                                }`}>
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card-clean p-12 text-center text-slate-400">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">Select a Placement Drive</h3>
                <p className="text-xs text-slate-500 mt-1">Click any drive from the left menu to view applicants and upload shortlist Excels.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Students Tab */}
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
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-slate-400">No student records found.</td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notices Tab */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          {notifications.map((notice) => (
            <div key={notice.notice_id} className="card-clean p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-base font-bold text-slate-900 font-heading">{notice.title}</h4>
                <p className="text-xs text-slate-600">{notice.message}</p>
                <span className="text-[11px] font-semibold text-blue-700 block pt-1">Target: {notice.target_branch}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Create Job Drive with Dynamic Round Builder */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" /> {editingJob ? 'Edit Placement Drive Details' : 'Post New Placement Drive'}
              </h3>
              <button
                onClick={() => {
                  resetJobForm();
                  setShowCreateModal(false);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cognizant / TCS / Infosys"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Role Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Software Development Engineer (SDE)"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Job Description & CTC Details</label>
                <textarea
                  className="form-input min-h-[80px]"
                  placeholder="Describe job role, responsibilities, salary package CTC, bond terms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="e.g. 7.5 (or 0 for no min)"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Max Backlogs Allowed</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 0 (Max active backlogs)"
                    value={maxBacklogs}
                    onChange={(e) => setMaxBacklogs(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Max Career Gap (Months)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 0 or 12 (Max gap months)"
                    value={maxGap}
                    onChange={(e) => setMaxGap(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Allowed Branches (Comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CSE, IT, MCA or ALL"
                    value={allowedBranches}
                    onChange={(e) => setAllowedBranches(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Application Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">External Apply / Registration Portal Link (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="e.g. https://careers.company.com/jobs/apply or registration form URL"
                  value={applyLink}
                  onChange={(e) => setApplyLink(e.target.value)}
                />
              </div>

              {/* Dynamic Hiring Round Builder */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 font-heading">
                  <Layers className="w-4 h-4 text-blue-600" /> Dynamic Recruitment Rounds Pipeline
                </h4>
                <p className="text-slate-500 text-[11px]">Define the exact order of rounds candidates will progress through.</p>

                {stages.length === 0 ? (
                  <p className="text-amber-700 text-[11px] font-semibold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No recruitment rounds added yet. Add custom stages below.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {stages.map((st, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-700 font-bold border border-slate-200 shadow-xs">
                        <span className="text-blue-600 font-extrabold">{idx + 1}.</span>
                        <span>{st}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(idx)}
                          className="text-rose-600 hover:text-rose-800 ml-1 p-0.5 rounded-md hover:bg-rose-50"
                          title="Remove stage"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    className="form-input py-1.5 text-xs"
                    placeholder="Add custom stage name (e.g. Technical Round II)"
                    value={newStageInput}
                    onChange={(e) => setNewStageInput(e.target.value)}
                  />
                  <button type="button" onClick={handleAddStage} className="btn-secondary py-1.5 px-3 text-xs font-semibold">
                    Add Stage
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetJobForm();
                    setShowCreateModal(false);
                  }}
                  className="btn-secondary py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submittingJob} className="btn-primary py-2 px-4 font-bold">
                  {submittingJob 
                    ? (editingJob ? 'Updating Drive...' : 'Creating Drive...') 
                    : (editingJob ? 'Save Drive Changes' : 'Publish Job Opening')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk Excel Shortlist Upload */}
      {showShortlistModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Upload Candidate Shortlist Excel
              </h3>
              <button onClick={() => setShowShortlistModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadShortlist} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center justify-between">
                <span>Download Sample Excel / CSV shortlist template</span>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="btn-secondary py-1 px-2.5 text-[11px] text-emerald-800 bg-white border-emerald-300 hover:bg-emerald-100"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>

              <div>
                <label className="form-label">Target Round Stage to Advance Shortlisted Students</label>
                <select
                  className="form-input"
                  value={targetStageOrder}
                  onChange={(e) => setTargetStageOrder(e.target.value)}
                  required
                >
                  <option value="">-- Select Target Stage --</option>
                  {selectedJob?.rounds?.map((r) => (
                    <option key={r.round_id} value={r.round_order}>
                      Advance to Round {r.round_order}: {r.round_name}
                    </option>
                  ))}
                  <option value={(selectedJob?.rounds?.length || 1) + 1}>
                    Final Selection (Mark as SELECTED / OFFER RECEIVED)
                  </option>
                </select>
              </div>

              <div>
                <label className="form-label">Upload Shortlist Excel File (.xlsx, .csv)</label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="form-input"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Must contain registration_id column matching student registration IDs.</p>
              </div>

              {uploadResult && (
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 space-y-1 text-slate-700 font-semibold">
                  <p className="text-emerald-700 font-bold">{uploadResult.message}</p>
                  <p>Advanced Candidates: {uploadResult.advanced_count}</p>
                  <p>Final Selections: {uploadResult.selected_count}</p>
                  <p>Rejected Candidates: {uploadResult.rejected_count}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowShortlistModal(false)} className="btn-secondary py-2 px-4">
                  Close
                </button>
                <button type="submit" disabled={uploadingExcel} className="btn-primary py-2 px-4 font-bold bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4" />
                  {uploadingExcel ? 'Processing Shortlist...' : 'Process Shortlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Publish Notice */}
      {showNoticeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold text-slate-900 mb-4 font-heading">Publish Campus Notice</h3>
            <form onSubmit={handlePublishNotice} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Notice Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Technical Interview Schedule Announcement"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Target Branch Group</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ALL or MCA or CSE"
                  value={noticeBranch}
                  onChange={(e) => setNoticeBranch(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Notice Details</label>
                <textarea
                  className="form-input min-h-[100px]"
                  placeholder="Enter detailed notice message for students..."
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNoticeModal(false)} className="btn-secondary py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 px-4 font-bold">
                  Publish Notice
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
          fetchJobs();
        }}
      />
    </div>
  );
};
