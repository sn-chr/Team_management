import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock } from 'lucide-react';

interface TargetTimes {
  id: number;
  weekday_target: number;
  weekend_target: number;
  updated_at: string;
}

const TargetTimeManagement = () => {
  const [targetTimes, setTargetTimes] = useState<TargetTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    weekday_target: 16,
    weekend_target: 8
  });

  // Fetch current target times
  const fetchTargetTimes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3090/api/target-times', {
        withCredentials: true
      });
      setTargetTimes(res.data);
      setFormData({
        weekday_target: res.data.weekday_target,
        weekend_target: res.data.weekend_target
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch target times');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargetTimes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      
      await axios.put(
        'http://localhost:3090/api/target-times',
        formData,
        { withCredentials: true }
      );
      
      setSuccess('Target times updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      fetchTargetTimes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update target times');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Target Working Times</h1>
          <p className="text-gray-600">Manage daily working time targets</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Update Target Times</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="weekday_target" className="block text-sm font-medium text-gray-700 mb-1">
                Weekday Target Hours *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="weekday_target"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.weekday_target}
                  onChange={(e) => setFormData({ ...formData, weekday_target: parseFloat(e.target.value) })}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="weekend_target" className="block text-sm font-medium text-gray-700 mb-1">
                Weekend Target Hours *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="weekend_target"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.weekend_target}
                  onChange={(e) => setFormData({ ...formData, weekend_target: parseFloat(e.target.value) })}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Target Times'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TargetTimeManagement; 