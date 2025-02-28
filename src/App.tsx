import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import WorkReports from './pages/WorkReports';
import TargetTimeManagement from './pages/TargetTimeManagement';
import Transactions from './pages/Transactions';
import { ThemeProvider } from './context/ThemeContext';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Admin only route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/users" 
                  element={
                    <AdminRoute>
                      <UserManagement />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <WorkReports />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/target-times" 
                  element={
                    <AdminRoute>
                      <TargetTimeManagement />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/transactions" 
                  element={
                    <ProtectedRoute>
                      <Transactions />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/login" />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;