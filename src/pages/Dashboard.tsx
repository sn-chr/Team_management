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
    <div className="container mx-auto px-4 py-8">

      {error && (
        <div className="mb-8 bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WeeklyWorkingTimeTable 
          data={workingTimeData} 
          loading={loading}
          currentWeek={currentWeek}
          onWeekChange={handleWeekChange}
        />
        <EarningChart data={earningData} />
      </div>
    </div>
  );
};

export default Dashboard;