import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, Target, Award } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import WeeklyWorkingTimeTable from '../components/dashboard/WeeklyWorkingTimeTable';
import EarningChart from '../components/dashboard/EarningChart';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { BarChart, Bar, Cell } from 'recharts';

interface WorkingTimeData {
  userId: number;
  userName: string;
  weeklyHours: {
    [key: string]: number | null;
  };
  totalHours: number;
}

interface MonthlyData {
  totalEarnings: number;
  totalTarget: number;
  userEarnings: Array<{
    userName: string;
    amount: number;
    target: number;
    transactionCount: number;
    progress: number;
  }>;
}

interface DashboardStats {
  totalUsers: number;
  monthlyPlan: number;
  monthlyProgress: number;
  totalEarnings: number;
  topUser: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [workingTimeData, setWorkingTimeData] = useState<WorkingTimeData[]>([]);
  const [earningData, setEarningData] = useState([]);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    monthlyPlan: 0,
    monthlyProgress: 0,
    totalEarnings: 0,
    topUser: 'N/A'
  });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [years] = useState(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchDashboardData = async (date: Date) => {
    try {
      setLoading(true);
      setError('');

      // Format date for the API
      const formattedDate = date.toISOString();
      
      console.log('Fetching data for date:', formattedDate);
      
      const workingTimeRes = await axios.get(
        `http://localhost:5000/api/reports/weekly?date=${formattedDate}`,
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
      const res = await axios.get(
        `http://localhost:5000/api/transactions/dashboard-stats/${currentYear}/${currentMonth + 1}`,
        { withCredentials: true }
      );
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

  // Fetch monthly earnings data
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/transactions/monthly/${currentYear}/${currentMonth + 1}`,
          { withCredentials: true }
        );
        setMonthlyData(response.data);
      } catch (error) {
        console.error('Error fetching monthly data:', error);
      }
    };

    fetchMonthlyData();
  }, [currentYear, currentMonth]);

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate random colors for users
  const generateColor = (index: number) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4'
    ];
    return colors[index % colors.length];
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
      title: 'Monthly Target',
      value: `$${dashboardStats.monthlyPlan.toLocaleString()}`,
      subtitle: 'Total target amount'
    },
    {
      icon: Target,
      title: 'Current Status',
      value: `$${dashboardStats.totalEarnings.toLocaleString()} (${dashboardStats.monthlyProgress}%)`,
      subtitle: 'Monthly earnings'
    },
    {
      icon: Award,
      title: 'Top Performer',
      value: dashboardStats.topUser,
      subtitle: `$${(monthlyData?.userEarnings?.find(u => u.userName === dashboardStats.topUser)?.amount || 0).toLocaleString()}`
    }
  ];

  // Fix the linter errors in the table section
  const hasEarningsData = monthlyData?.userEarnings && monthlyData.userEarnings.length > 0;

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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                Monthly Earnings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total earnings for {months[currentMonth]} {currentYear}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  ${monthlyData?.totalEarnings?.toLocaleString() || '0'}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">earned</span>
                </p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  ${monthlyData?.totalTarget?.toLocaleString() || '0'}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">target</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Year Select */}
              <Listbox value={currentYear} onChange={setCurrentYear}>
                <div className="relative">
                  <Listbox.Button className="relative w-32 py-2 pl-3 pr-10 text-left bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <span className="block truncate text-gray-900 dark:text-white">{currentYear}</span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none ring-1 ring-black ring-opacity-5">
                      {years.map((year) => (
                        <Listbox.Option
                          key={year}
                          value={year}
                          className={({ active }) =>
                            `${
                              active
                                ? 'text-white bg-blue-600 dark:bg-blue-500'
                                : 'text-gray-900 dark:text-white'
                            } cursor-pointer select-none relative py-2 pl-3 pr-9`
                          }
                        >
                          {year}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>

              {/* Month Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousMonth}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {months[(currentMonth - 1 + 12) % 12].substring(0, 3)}
                </button>
                <span className="text-lg font-medium text-gray-900 dark:text-white min-w-[100px] text-center">
                  {months[currentMonth]}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {months[(currentMonth + 1) % 12].substring(0, 3)}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[400px] w-full">
            {!monthlyData?.userEarnings?.length ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  No earnings data available for this month
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData?.userEarnings || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="userName"
                    stroke={theme === 'dark' ? '#9CA3AF' : '#4B5563'}
                    tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke={theme === 'dark' ? '#9CA3AF' : '#4B5563'}
                    tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                    cursor={{ fill: theme === 'dark' ? '#374151' : '#F3F4F6', opacity: 0.5 }}
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`,
                      name === 'amount' ? 'Earnings' : 'Target'
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="target"
                    name="Target"
                    fill={theme === 'dark' ? '#059669' : '#10B981'}
                    radius={[4, 4, 0, 0]}
                    opacity={0.3}
                  />
                  <Bar
                    dataKey="amount"
                    name="Earnings"
                    fill={theme === 'dark' ? '#3B82F6' : '#60A5FA'}
                    radius={[4, 4, 0, 0]}
                  >
                    {monthlyData?.userEarnings?.map((entry, index) => (
                      <Cell
                        key={entry.userName}
                        fill={generateColor(index)}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* User Earnings Table */}
          {hasEarningsData && (
            <div className="mt-6">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {monthlyData!.userEarnings.map((user, index) => (
                    <tr key={user.userName} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {user.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">
                        ${user.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        ${user.target.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                Number(user.progress) >= 100 
                                  ? 'bg-green-500 dark:bg-green-400' 
                                  : 'bg-blue-500 dark:bg-blue-400'
                              }`}
                              style={{ width: `${Math.min(Number(user.progress), 100)}%` }}
                            />
                          </div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                            {user.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.transactionCount} transactions
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;