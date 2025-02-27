import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, Settings, Shield } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { id: 1, name: 'Total Users', value: '1,234', icon: <Users className="h-6 w-6" /> },
    { id: 2, name: 'Active Users', value: '891', icon: <UserCheck className="h-6 w-6" /> },
    { id: 3, name: 'System Status', value: 'Healthy', icon: <Settings className="h-6 w-6" /> },
    { id: 4, name: 'Security Level', value: 'High', icon: <Shield className="h-6 w-6" /> },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-md bg-blue-50 text-blue-600">
                {stat.icon}
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">{stat.name}</h2>
                <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 font-medium">U{item}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">User Activity {item}</p>
                  <p className="text-sm text-gray-500">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(Date.now() - item * 3600000).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;