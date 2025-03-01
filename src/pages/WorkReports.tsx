import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Clock, Calendar, Trash2, PencilIcon, Search, ChevronLeft, ChevronRight, SlidersHorizontal, FileText, User, Sun, Moon } from 'lucide-react';
import { timeFormat } from '../utils/timeFormat';
import { Transition } from '@headlessui/react';
import { useTheme } from '../context/ThemeContext';

interface WorkReport {
  id: number;
  user_id: number;
  user_name: string;
  report_date: string;
  working_hours: number;
  description: string;
  created_at: string;
}

interface TargetTimes {
  weekday_target: number;
  weekend_target: number;
}

const WorkReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const reportsPerPage = 7;
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<WorkReport | null>(null);
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    working_hours: '08:00',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [targetTimes, setTargetTimes] = useState<TargetTimes>({
    weekday_target: 16,
    weekend_target: 8
  });

  const [showFilters, setShowFilters] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // Filter reports based on search and date range
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.working_hours.toString().includes(searchTerm) ||
      new Date(report.report_date).toLocaleDateString().includes(searchTerm);
      
    const reportDate = new Date(report.report_date);
    const afterStartDate = !dateRange.startDate || reportDate >= new Date(dateRange.startDate);
    const beforeEndDate = !dateRange.endDate || reportDate <= new Date(dateRange.endDate);
    
    return matchesSearch && afterStartDate && beforeEndDate;
  });

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/reports/${user?.id}`, {
        withCredentials: true
      });
      // Sort reports by date in descending order and convert working_hours to number
      const sortedReports = res.data.reports
        .map((report: WorkReport) => ({
          ...report,
          working_hours: Number(report.working_hours)  // Convert string to number explicitly
        }))
        .sort((a: WorkReport, b: WorkReport) => 
          new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
        );
      setReports(sortedReports);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchReports();
    }
  }, [user?.id]);

  // Reset pagination when search or date range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange]);

  useEffect(() => {
    const fetchTargetTimes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/target-times', {
          withCredentials: true
        });
        setTargetTimes(res.data);
      } catch (error) {
        console.error('Failed to fetch target times:', error);
      }
    };

    fetchTargetTimes();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setFormError('');

      // Validate time format
      if (!timeFormat.isValid(formData.working_hours)) {
        setFormError('Please enter time in HH:MM format (e.g., 08:30)');
        return;
      }

      // Convert HH:MM to decimal for database
      const workingHours = timeFormat.toDecimal(formData.working_hours);
      
      const payload = {
        ...formData,
        working_hours: workingHours
      };
      
      if (editingReport) {
        await axios.put(
          `http://localhost:5000/api/reports/${editingReport.id}`,
          payload,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          'http://localhost:5000/api/reports',
          payload,
          { withCredentials: true }
        );
      }
      
      setSuccess(editingReport ? 'Report updated successfully' : 'Report added successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reset form
      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        working_hours: '08:00',
        description: ''
      });
      setShowForm(false);
      setEditingReport(null);
      
      // Refresh reports
      fetchReports();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/reports/${id}`, {
        withCredentials: true
      });
      
      setSuccess('Report deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      fetchReports();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const getReportStatus = (report: WorkReport) => {
    const reportDate = new Date(report.report_date);
    const isSunday = reportDate.getDay() === 0;
    const target = isSunday ? Number(targetTimes.weekend_target) : Number(targetTimes.weekday_target);
    
    return {
      met: report.working_hours >= target,
      target,
      isSunday,
      difference: report.working_hours - target
    };
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Work Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your daily working hours</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
              showFilters 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            Filters
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Clock className="h-5 w-5 mr-2" />
            Add Report
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <Transition
        show={showFilters}
        enter="transition-all duration-300 ease-out"
        enterFrom="transform -translate-y-4 opacity-0"
        enterTo="transform translate-y-0 opacity-100"
        leave="transition-all duration-200 ease-in"
        leaveFrom="transform translate-y-0 opacity-100"
        leaveTo="transform -translate-y-4 opacity-0"
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Description Search */}
            <div className="flex-1 min-w-[240px]">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
                <FileText className="w-4 h-4 mr-2" />
                Description
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Search by description..."
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                Start Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                End Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>

      {/* Success and Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-200 p-3 rounded-md mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editingReport ? 'Edit Report' : 'New Report'}
              </h2>
            </div>
            
            {formError && (
              <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 p-3 rounded-md">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label htmlFor="report_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="report_date"
                      type="date"
                      value={formData.report_date}
                      onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                      disabled={!!editingReport}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="working_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Working Hours *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="working_hours"
                      id="working_hours"
                      required
                      placeholder="HH:MM (e.g., 08:30)"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                      value={formData.working_hours}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow only numbers and colon
                        if (!/^[\d:]*$/.test(value)) return;

                        // Auto-format as user types
                        let formattedValue = value.replace(/[^\d]/g, ''); // Remove non-digits
                        if (formattedValue.length > 2) {
                          formattedValue = `${formattedValue.slice(0, 2)}:${formattedValue.slice(2, 4)}`;
                        }
                        
                        setFormData(prev => ({ 
                          ...prev, 
                          working_hours: formattedValue
                        }));
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (!value) return;

                        // Format on blur for incomplete inputs
                        if (timeFormat.isValid(value)) {
                          const [hours, minutes] = value.split(':');
                          const formattedValue = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                          setFormData(prev => ({ 
                            ...prev, 
                            working_hours: formattedValue
                          }));
                        }
                      }}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  {formError && formError.includes('time') && (
                    <p className="mt-2 text-sm text-red-600">
                      {formError}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      rows={3}
                      placeholder="What did you work on today?"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReport(null);
                    setFormError('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium 
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm 
                           text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (editingReport ? 'Updating...' : 'Adding...') : (editingReport ? 'Update Report' : 'Add Report')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Work Reports List</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">No reports found</div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentReports.map((report) => (
                <div 
                  key={report.id} 
                  className={`px-6 py-4 hover:bg-opacity-75 transition-colors ${
                    getReportStatus(report).difference >= 0
                      ? 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50' 
                      : 'bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="flex items-center">
                            {new Date(report.report_date).toLocaleDateString()}
                            {getReportStatus(report).isSunday && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                                Sunday
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-baseline">
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {timeFormat.toHHMM(report.working_hours)} hours
                        </div>
                        <div className="ml-2 text-sm">
                          {getReportStatus(report).difference >= 0 ? (
                            <span className="text-green-600 dark:text-green-400">
                              (+{timeFormat.formatTimeDifference(getReportStatus(report).difference)})
                            </span>
                          ) : (
                            <span className="text-yellow-600 dark:text-yellow-400">
                              ({timeFormat.formatTimeDifference(getReportStatus(report).difference)})
                            </span>
                          )}
                        </div>
                      </div>
                      {report.description && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {report.description}
                        </div>
                      )}
                      <div className="mt-1 text-sm flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className={`${
                          getReportStatus(report).difference >= 0
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          Target: {timeFormat.toHHMM(getReportStatus(report).target)} hours
                          {getReportStatus(report).isSunday && ' (Sunday)'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setEditingReport(report);
                          setFormData({
                            report_date: report.report_date,
                            working_hours: timeFormat.toHHMM(report.working_hours),
                            description: report.description
                          });
                          setShowForm(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {indexOfFirstReport + 1} to {Math.min(indexOfLastReport, filteredReports.length)} of{' '}
                  {filteredReports.length} reports
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                             text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 
                             bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                             text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 
                             bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkReports; 