import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, Target, Award } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import WeeklyWorkingTimeTable from '../components/dashboard/WeeklyWorkingTimeTable';
import EarningChart from '../components/dashboard/EarningChart';

interface WorkingTimeData {
  userId: number;
  userName: string;
  weeklyHours: {
    [key: string]: number | null;
  };
  totalHours: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workingTimeData, setWorkingTimeData] = useState<WorkingTimeData[]>([]);
  const [earningData, setEarningData] = useState([]);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    monthlyPlan: 0,
    monthlyProgress: 0,
    topUser: 'N/A'
  });

  const fetchDashboardData = async (date: Date) => {
    try {
      setLoading(true);
      setError('');

      // Format date for the API
      const formattedDate = date.toISOString();
      
      console.log('Fetching data for date:', formattedDate);
      
      const workingTimeRes = await axios.get(
        `http://localhost:3090/api/reports/weekly?date=${formattedDate}`,
        { withCredentials: true }
      );
      setWorkingTimeData(workingTimeRes.data);

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get('http://localhost:3090/api/dashboard/stats', {
        withCredentials: true
      });
      setDashboardStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData(currentWeek);
    fetchDashboardStats();
  }, [currentWeek]);

  const handleWeekChange = (date: Date) => {
    setCurrentWeek(date);
  };

  const stats = [
    { 
      icon: Users,
      title: 'Total Users',
      value: dashboardStats.totalUsers.toString(),
      subtitle: 'Active users'
    },
    {
      icon: DollarSign,
      title: 'Monthly Plan',
      value: `$${dashboardStats.monthlyPlan.toLocaleString()}`,
      subtitle: 'Total users plan'
    },
    {
      icon: Target,
      title: 'Current Status',
      value: `${dashboardStats.monthlyProgress}%`,
      subtitle: 'Monthly progress'
    },
    {
      icon: Award,
      title: 'Top User',
      value: dashboardStats.topUser,
      subtitle: 'This month'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900">
      {error && (
        <div className="mb-8 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
                {React.createElement(stat.icon, {
                  className: "h-6 w-6 text-blue-600 dark:text-blue-400"
                })}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Weekly Working Time
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => handleWeekChange(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Previous Week
              </button>
              <button
                onClick={() => handleWeekChange(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Next Week
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    {Object.keys(workingTimeData[0]?.weeklyHours || {}).map(day => (
                      <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {day}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {workingTimeData.map((userData, index) => (
                    <tr key={userData.userId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {userData.userName}
                      </td>
                      {Object.values(userData.weeklyHours).map((hours, idx) => (
                        <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {hours === null ? '-' : `${hours}h`}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {userData.totalHours}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
            Monthly Earnings
          </h2>
          <EarningChart data={earningData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;