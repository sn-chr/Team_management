import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormError('');
      await login(email, password);
      navigate(isAdmin ? '/users' : '/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>
        
        {(formError || error) && (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md mb-4">
            {formError || error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md 
                     hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Default admin: admin@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;