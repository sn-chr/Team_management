import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User, LayoutDashboard, Users, Menu, X, Clock, CreditCard, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    ...(isAdmin ? [
      { name: 'User Management', path: '/users', icon: <Users className="h-5 w-5" /> },
      { name: 'Target Times', path: '/target-times', icon: <Clock className="h-5 w-5" /> }
    ] : []),
    { name: 'Work Reports', path: '/reports', icon: <Clock className="h-5 w-5" /> },
    { name: 'Transactions', path: '/transactions', icon: <CreditCard className="h-5 w-5" /> },
    { name: 'Profile', path: '/profile', icon: <User className="h-5 w-5" /> },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-gray-800 dark:text-white">
                TimeTracker
              </Link>
            </div>

            {isAuthenticated && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${location.pathname === '/dashboard'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                    }`}
                >
                  <LayoutDashboard className="w-5 h-5 mr-1" />
                  Dashboard
                </Link>

                <Link
                  to="/reports"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${location.pathname === '/reports'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                    }`}
                >
                  <Clock className="w-5 h-5 mr-1" />
                  Reports
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      to="/users"
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium ${location.pathname === '/users'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                        }`}
                    >
                      <Users className="w-5 h-5 mr-1" />
                      Users
                    </Link>

                    <Link
                      to="/target-times"
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium ${location.pathname === '/target-times'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                        }`}
                    >
                      <Clock className="w-5 h-5 mr-1" />
                      Target Times
                    </Link>

                  </>
                )}
                <Link
                  to="/transactions"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${location.pathname === '/transactions'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                    }`}
                >
                  <CreditCard className="w-5 h-5 mr-1" />
                  Transactions
                </Link>
              </div>
            )}
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hello, {user?.name} {isAdmin && <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">(Admin)</span>}
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${location.pathname === '/login'
                      ? 'bg-blue-50 text-blue-700 dark:text-gray-300 dark:hover:text-white'
                      : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                    }`}
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated && navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-3 py-2 text-base font-medium ${location.pathname === link.path
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="mr-2">{link.icon}</span>
                {link.name}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <button
                  onClick={toggleTheme}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {theme === 'light' ? (
                    <Moon className="h-5 w-5 mr-2" />
                  ) : (
                    <Sun className="h-5 w-5 mr-2" />
                  )}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;