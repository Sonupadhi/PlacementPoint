import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ProgressBar } from '../components/ProgressBar';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  Award, 
  Bell, 
  HelpCircle, 
  ExternalLink, 
  Search, 
  MessageSquare,
  Building,
  Calendar,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';

export const StudentDashboard = () => {
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState('eligible');
  const [eligibleJobs, setEligibleJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [queries, setQueries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [searchFaq, setSearchFaq] = useState('');

  // Query modal state
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [querySubmitting, setQuerySubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes, notifRes, faqsRes, queriesRes] = await Promise.all([
        api.get('/jobs/eligible/'),
        api.get('/applications/my-applications/'),
        api.get('/notifications/'),
        api.get('/faqs/'),
        api.get('/queries/')
      ]);

      setEligibleJobs(jobsRes.data);
      setMyApplications(appsRes.data);
      setNotifications(notifRes.data);
      setFaqs(faqsRes.data);
      setQueries(queriesRes.data);
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // External Apply Confirmation Modal State
  const [showApplyConfirmModal, setShowApplyConfirmModal] = useState(false);
  const [pendingJob, setPendingJob] = useState(null);

  const openConfirmApplyModal = (job) => {
    setPendingJob(job);
    setShowApplyConfirmModal(true);
  };

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    try {
      await api.post('/applications/apply/', { job_id: jobId });
      showToast('Successfully registered application in PlacementPoint!');
      setShowApplyConfirmModal(false);
      setPendingJob(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to register application.');
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleWithdraw = async (jobId) => {
    if (!window.confirm('Are you sure you want to withdraw your application for this drive?')) return;
    try {
      await api.delete('/applications/apply/', { data: { job_id: jobId } });
      showToast('Application withdrawn successfully.');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to withdraw application.');
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setQuerySubmitting(true);
    try {
      await api.post('/queries/', {
        subject: querySubject,
        message: queryMessage
      });
      showToast('Query submitted to placement coordinator successfully!');
      setShowQueryModal(false);
      setQuerySubject('');
      setQueryMessage('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit query.');
    } finally {
      setQuerySubmitting(false);
    }
  };

  const selectedCount = myApplications.filter(a => a.status === 'SELECTED').length;
  const inProgressCount = myApplications.filter(a => a.status === 'IN_PROGRESS').length;

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchFaq.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchFaq.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-blue-600 text-white font-semibold shadow-xl shadow-blue-500/20 flex items-center gap-3 animate-bounce text-xs">
          <CheckCircle className="w-5 h-5 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Student Welcome Header Card */}
      <div className="card-clean p-7 border-slate-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            Welcome, <span className="text-blue-600">{profile?.name || 'Student'}</span> 👋
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Reg ID: <span className="text-slate-800 font-bold">{profile?.registration_id}</span> • 
            Branch: <span className="text-slate-800 font-bold">{profile?.branch}</span> • 
            CGPA: <span className="text-emerald-600 font-bold">{profile?.cgpa}</span> • 
            Active Backlogs: <span className="text-blue-700 font-bold">{profile?.active_backlogs}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQueryModal(true)}
            className="btn-secondary py-2.5 px-4 text-xs font-bold text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Ask Query</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-clean p-5 bg-blue-50/50 border-blue-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Eligible Drives</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1 font-heading">{eligibleJobs.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card-clean p-5 bg-sky-50/50 border-sky-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Active Applications</p>
              <h3 className="text-3xl font-extrabold text-sky-900 mt-1 font-heading">{inProgressCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card-clean p-5 bg-emerald-50/50 border-emerald-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Offers Received</p>
              <h3 className="text-3xl font-extrabold text-emerald-900 mt-1 font-heading">{selectedCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card-clean p-5 bg-indigo-50/50 border-indigo-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Campus Notices</p>
              <h3 className="text-3xl font-extrabold text-indigo-900 mt-1 font-heading">{notifications.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Bell className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveTab('eligible')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'eligible'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Eligible Drives ({eligibleJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'applications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" /> Application Tracker ({myApplications.length})
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'notices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" /> Notices ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'faqs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> FAQs & Query Tool
        </button>
      </div>

      {/* Tab 1: Eligible Placement Drives */}
      {activeTab === 'eligible' && (
        <div>
          {eligibleJobs.length === 0 ? (
            <div className="card-clean p-12 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Active Drives Currently Eligible</h3>
              <p className="text-xs text-slate-500 mt-1">Check back soon for upcoming campus placement drives.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eligibleJobs.map((job) => (
                <div key={job.job_id} className="card-clean p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
                          <Building className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 font-heading">{job.company_name}</h3>
                          <p className="text-xs font-bold text-blue-600">{job.role_title}</p>
                        </div>
                      </div>
                      <span className="badge badge-selected bg-emerald-50 text-emerald-700 border-emerald-200">
                        Eligible
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 my-3.5 leading-relaxed">{job.description}</p>

                    {/* Criteria Tags */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                        Min CGPA: <strong className="text-slate-900">{job.min_cgpa}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                        Max Backlogs: <strong className="text-slate-900">{job.max_backlogs}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                        Branches: <strong className="text-slate-900">{job.allowed_branches}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>

                    {job.has_applied ? (
                      <div className="flex items-center gap-2">
                        <span className="badge badge-in-progress py-2 px-3 text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Applied
                        </span>
                        <button
                          onClick={() => handleWithdraw(job.job_id)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 border border-rose-200/60 transition-colors"
                          title="Withdraw Application"
                        >
                          Withdraw
                        </button>
                      </div>
                    ) : job.apply_link && (job.apply_link.startsWith('http://') || job.apply_link.startsWith('https://')) ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={job.apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary py-2 px-3 text-xs font-bold text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100 flex items-center gap-1.5"
                        >
                          <span>Visit Job Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => openConfirmApplyModal(job)}
                          className="btn-primary py-2 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark as Applied</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(job.job_id)}
                        disabled={applyingJobId === job.job_id}
                        className="btn-primary py-2 px-4 text-xs font-bold"
                      >
                        <span>{applyingJobId === job.job_id ? 'Applying...' : 'Apply Now'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Application Tracker */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {myApplications.length === 0 ? (
            <div className="card-clean p-12 text-center text-slate-400">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Active Applications</h3>
              <p className="text-xs text-slate-500 mt-1">Apply to eligible placement drives to track your progress.</p>
            </div>
          ) : (
            myApplications.map((app) => (
              <div key={app.application_id} className="card-clean p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 font-heading">{app.job.company_name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{app.job.role_title} • Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {app.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleWithdraw(app.job.job_id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>

                {/* Dynamic Visual Progress Bar */}
                <ProgressBar
                  rounds={app.job.rounds}
                  currentRound={app.current_round}
                  status={app.status}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Notices */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          {notifications.map((notice) => (
            <div key={notice.notice_id} className="card-clean p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900 font-heading">{notice.title}</h4>
                  <span className="text-xs font-semibold text-slate-400">{new Date(notice.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notice.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: FAQs & Query Tool */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Search placement FAQs..."
                value={searchFaq}
                onChange={(e) => setSearchFaq(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowQueryModal(true)}
              className="btn-primary py-2.5 px-4 text-xs font-bold shrink-0"
            >
              <Plus className="w-4 h-4" /> Ask Query
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq) => (
              <div key={faq.faq_id} className="card-clean p-5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <h4 className="text-sm font-bold text-slate-900">{faq.question}</h4>
                </div>
                <p className="text-xs text-slate-600 pl-7 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          {/* Submitted Queries */}
          {queries.length > 0 && (
            <div className="pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 font-heading">Your Submitted Queries</h3>
              <div className="space-y-3">
                {queries.map((q) => (
                  <div key={q.query_id} className="card-clean p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{q.subject}</span>
                      <span className={`badge ${q.status === 'RESOLVED' ? 'badge-selected' : 'badge-in-progress'}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{q.message}</p>
                    {q.response && (
                      <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                        <strong className="font-bold">Coordinator Response:</strong> {q.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ask Query Modal */}
      {showQueryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold text-slate-900 mb-4 font-heading">Submit Query to Placement Cell</h3>
            <form onSubmit={handleQuerySubmit} className="space-y-4">
              <div>
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Eligibility discrepancy for TCS drive"
                  value={querySubject}
                  onChange={(e) => setQuerySubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Query Message</label>
                <textarea
                  className="form-input min-h-[120px]"
                  placeholder="Describe your issue or question in detail..."
                  value={queryMessage}
                  onChange={(e) => setQueryMessage(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQueryModal(false)}
                  className="btn-secondary py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={querySubmitting}
                  className="btn-primary py-2 px-4 text-xs font-bold"
                >
                  {querySubmitting ? 'Submitting...' : 'Submit Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: External Application Confirmation */}
      {showApplyConfirmModal && pendingJob && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> Confirm Application Status
              </h3>
              <button
                onClick={() => {
                  setShowApplyConfirmModal(false);
                  setPendingJob(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 font-medium leading-relaxed">
                Did you complete and submit your job application on the company portal for <strong className="text-slate-900">{pendingJob.company_name} ({pendingJob.role_title})</strong>?
              </p>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> Important Note:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Only click <strong>"Yes, I Have Applied"</strong> if you have actually submitted your application on the company website. If you only visited the page, click <strong>"Not Yet"</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowApplyConfirmModal(false);
                  setPendingJob(null);
                }}
                className="btn-secondary py-2 px-4 text-xs font-semibold"
              >
                Not Yet
              </button>

              <button
                type="button"
                onClick={() => handleApply(pendingJob.job_id)}
                disabled={applyingJobId === pendingJob.job_id}
                className="btn-primary py-2 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                {applyingJobId === pendingJob.job_id ? 'Registering...' : 'Yes, I Have Applied'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
