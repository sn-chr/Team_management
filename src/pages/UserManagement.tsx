import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Plus, Trash2, PencilIcon, Search, SlidersHorizontal, Mail, Key, UserCircle, Shield, X } from 'lucide-react';
import { Transition } from '@headlessui/react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ApiResponse {
  users: UserData[];
  message?: string;
}

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get<ApiResponse>('http://localhost:5000/api/users', {
        withCredentials: true
      });
      
      // Check if res.data.users exists, if not, use an empty array
      setUsers(res.data.users || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingUser) {
        const res = await axios.put(
          `http://localhost:5000/api/users/${editingUser.id}`,
          formData,
          { withCredentials: true }
        );
        if (res.data.message) {
          setSuccess(res.data.message);
        } else {
          setSuccess('User updated successfully');
        }
      } else {
        const res = await axios.post(
          'http://localhost:5000/api/users',
          formData,
          { withCredentials: true }
        );
        if (res.data.message) {
          setSuccess(res.data.message);
        } else {
          setSuccess('User added successfully');
        }
      }

      setTimeout(() => setSuccess(''), 3000);
      
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user'
      });
      setShowForm(false);
      setEditingUser(null);
      
      fetchUsers(); // Refresh the users list
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    // Check if user is admin
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.role === 'admin') {
      setError('Admin users cannot be deleted');
      return;
    }

    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const res = await axios.delete(`http://localhost:5000/api/users/${id}`, {
        withCredentials: true
      });
      
      if (res.data.message) {
        setSuccess(res.data.message);
      } else {
        setSuccess('User deleted successfully');
      }
      setTimeout(() => setSuccess(''), 3000);
      
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              name: '',
              email: '',
              password: '',
              role: 'user'
            });
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium 
                   rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 
                   dark:hover:bg-blue-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </button>
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
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Users
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
                  placeholder="Search by name, email, or role..."
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

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {formError && (
              <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 p-3 rounded-md">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        required={!editingUser}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="role"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormError('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium 
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  {isSubmitting ? (editingUser ? 'Updating...' : 'Adding...') : (editingUser ? 'Update User' : 'Add User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Users List</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">No users found</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((userData) => (
              <div key={userData.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{userData.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{userData.email}</p>
                      </div>
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${userData.role === 'admin' 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        }`}
                      >
                        {userData.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setEditingUser(userData);
                        setFormData({
                          name: userData.name,
                          email: userData.email,
                          password: '',
                          role: userData.role
                        });
                        setShowForm(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(userData.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;