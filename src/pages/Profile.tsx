import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Camera } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would update the user profile here
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-200">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <User className="h-16 w-16 text-blue-600" />
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-800">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              
              <div className="mt-6">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="md:w-2/3 p-8">
            <h3 className="text-lg font-medium text-gray-800 mb-6">
              {isEditing ? 'Edit Profile Information' : 'Profile Information'}
            </h3>
            
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex border-b border-gray-200 pb-4">
                  <div className="w-1/3 text-sm font-medium text-gray-500">Full Name</div>
                  <div className="w-2/3 text-sm text-gray-900">{user?.name}</div>
                </div>
                <div className="flex border-b border-gray-200 pb-4">
                  <div className="w-1/3 text-sm font-medium text-gray-500">Email Address</div>
                  <div className="w-2/3 text-sm text-gray-900">{user?.email}</div>
                </div>
                <div className="flex border-b border-gray-200 pb-4">
                  <div className="w-1/3 text-sm font-medium text-gray-500">User ID</div>
                  <div className="w-2/3 text-sm text-gray-900">#{user?.id}</div>
                </div>
                <div className="flex">
                  <div className="w-1/3 text-sm font-medium text-gray-500">Account Created</div>
                  <div className="w-2/3 text-sm text-gray-900">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;