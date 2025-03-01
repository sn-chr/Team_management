import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import "react-datepicker/dist/react-datepicker.css";
import {
  Plus,
  Calendar,
  Trash2,
  Edit2,
  Search,
  SlidersHorizontal,
  CreditCard,
  Wallet,
  Building2,
  Bitcoin,
  DollarSign,
  User,
  Globe,
  Receipt,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import countryList from 'react-select-country-list';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';
import { components } from 'react-select';
import { useAuth } from '../context/AuthContext';

interface Transaction {
  id: number;
  clientName: string;
  clientCountry: string;
  amount: number;
  paymentType: string;
  date: Date;
  note: string;
  userName: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// Add this interface for User type
interface User extends SelectOption {
  id: number;
  email?: string;
}

const paymentTypes: SelectOption[] = [
  // Credit/Debit Cards
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'amex', label: 'American Express' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'visa', label: 'Visa' },

  // Digital Wallets
  { value: 'paypal', label: 'PayPal' },
  { value: 'google_pay', label: 'Google Pay' },
  { value: 'apple_pay', label: 'Apple Pay' },
  { value: 'samsung_pay', label: 'Samsung Pay' },
  { value: 'alipay', label: 'Alipay' },
  { value: 'wechat_pay', label: 'WeChat Pay' },
  { value: 'venmo', label: 'Venmo' },

  // Bank Transfers
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'wire_transfer', label: 'Wire Transfer' },
  { value: 'sepa', label: 'SEPA Transfer' },
  { value: 'ach', label: 'ACH Transfer' },

  // Cryptocurrencies
  { value: 'bitcoin', label: 'Bitcoin (BTC)' },
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'usdt', label: 'Tether (USDT)' },
  { value: 'usdc', label: 'USD Coin (USDC)' },

  // Other Digital Payment Methods
  { value: 'stripe', label: 'Stripe' },
  { value: 'klarna', label: 'Klarna' },
  { value: 'affirm', label: 'Affirm' },
  { value: 'wise', label: 'Wise (TransferWise)' },

  // Traditional Methods
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'money_order', label: 'Money Order' }
];

// Group the payment options
const groupedPaymentTypes = [
  {
    label: 'Credit/Debit Cards',
    options: paymentTypes.slice(0, 5)
  },
  {
    label: 'Digital Wallets',
    options: paymentTypes.slice(5, 12)
  },
  {
    label: 'Bank Transfers',
    options: paymentTypes.slice(12, 16)
  },
  {
    label: 'Cryptocurrencies',
    options: paymentTypes.slice(16, 20)
  },
  {
    label: 'Other Digital Payments',
    options: paymentTypes.slice(20, 24)
  },
  {
    label: 'Traditional Methods',
    options: paymentTypes.slice(24)
  }
];

interface FormData {
  clientName: string;
  clientCountry: SelectOption | null;
  amount: string;
  paymentType: SelectOption | null;
  date: Date;
  note: string;
  userName: User | null;
}

// Update the formatCountryData function to include full names
const formatCountryData = () => {
  return countryList().getData().map(country => ({
    value: country.value.toLowerCase(),
    label: country.label,
    flag: `https://flagcdn.com/w20/${country.value.toLowerCase()}.png`
  }));
};

// Update the getFlagEmoji function to handle country codes correctly
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '';

  try {
    // Convert country code to uppercase
    const code = countryCode.toUpperCase();
    // Convert the country code to regional indicator symbols
    return code
      .split('')
      .map(letter => String.fromCodePoint(127397 + letter.charCodeAt(0)))
      .join('');
  } catch (error) {
    console.error('Error creating flag emoji:', error);
    return '';
  }
};

interface FilterData {
  clientName: string;
  clientCountry: SelectOption | null;
  startDate: Date | null;
  endDate: Date | null;
  minAmount: string;
  maxAmount: string;
}

export default function Transactions() {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientCountry: null,
    amount: '',
    paymentType: null,
    date: new Date(),
    note: '',
    userName: null
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterData, setFilterData] = useState<FilterData>({
    clientName: '',
    clientCountry: null,
    startDate: null,
    endDate: null,
    minAmount: '',
    maxAmount: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Update the countries constant
  const countries = formatCountryData();

  // Handle date range changes
  const handleStartDateChange = (date: Date | null) => {
    setFilterData(prev => ({
      ...prev,
      startDate: date,
      endDate: prev.endDate && date && prev.endDate < date ? null : prev.endDate
    }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setFilterData(prev => ({
      ...prev,
      endDate: date
    }));
  };

  // Fetch transactions with enhanced error handling
  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions', {
        withCredentials: true
      });
      const formattedTransactions = response.data.map((transaction: any) => ({
        id: transaction.id,
        clientName: transaction.client_name,
        clientCountry: transaction.client_country,
        amount: transaction.amount,
        paymentType: transaction.payment_type,
        date: new Date(transaction.transaction_date),
        note: transaction.note || '',
        userName: transaction.user_name
      }));
      setTransactions(formattedTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      notifyError(error.response?.data?.message || 'Failed to fetch transactions');
    }
  };

  // Update the fetchUsers function
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/users', {
        withCredentials: true
      });
      console.log(response.data)
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      notifyError(error.response?.data?.message || 'Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const transactionData = {
        clientName: formData.clientName,
        clientCountry: formData.clientCountry?.value.toUpperCase() || '',
        amount: Number(formData.amount),
        paymentType: formData.paymentType?.value || '',
        date: formData.date,
        note: formData.note,
        userName: isAdmin ? formData.userName?.value : user?.name
      };

      if (isEditing && editingId) {
        await axios.put(`http://localhost:5000/api/transactions/${editingId}`, transactionData, {
          withCredentials: true
        });
        notifySuccess('Transaction updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/transactions', transactionData, {
          withCredentials: true
        });
        notifySuccess('Transaction created successfully');
      }

      setIsOpen(false);
      setIsEditing(false);
      setEditingId(null);
      resetForm();
      fetchTransactions();
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      notifyError(error.response?.data?.message || 'Failed to submit transaction');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    const countryOption = {
      value: transaction.clientCountry.toLowerCase(),
      label: countries.find(c => c.value === transaction.clientCountry.toLowerCase())?.label || transaction.clientCountry,
      flag: `https://flagcdn.com/w20/${transaction.clientCountry.toLowerCase()}.png`
    };
    const userOption = users.find(u => u.value === transaction.userName);
    
    setFormData({
      clientName: transaction.clientName,
      clientCountry: countryOption,
      amount: transaction.amount.toString(),
      paymentType: paymentTypes.find(pt => pt.value === transaction.paymentType) || {
        value: transaction.paymentType,
        label: transaction.paymentType
      },
      date: new Date(transaction.date),
      note: transaction.note,
      userName: userOption || null
    });
    setEditingId(transaction.id);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`http://localhost:5000/api/transactions/${id}`, {
          withCredentials: true
        });
        notifySuccess('Transaction deleted successfully');
        fetchTransactions();
      } catch (error: any) {
        console.error('Error deleting transaction:', error);
        notifyError(error.response?.data?.message || 'Failed to delete transaction');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientCountry: null,
      amount: '',
      paymentType: null,
      date: new Date(),
      note: '',
      userName: null
    });
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesName = transaction.clientName.toLowerCase().includes(filterData.clientName.toLowerCase());
    const matchesCountry = !filterData.clientCountry || transaction.clientCountry.toLowerCase() === filterData.clientCountry.value.toLowerCase();
    const matchesDate = (!filterData.startDate || new Date(transaction.date) >= filterData.startDate) &&
      (!filterData.endDate || new Date(transaction.date) <= filterData.endDate);
    const matchesAmount = (!filterData.minAmount || transaction.amount >= Number(filterData.minAmount)) &&
      (!filterData.maxAmount || transaction.amount <= Number(filterData.maxAmount));

    return matchesName && matchesCountry && matchesDate && matchesAmount;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Custom payment option component with icon
  const PaymentOption = ({ innerProps, label, data }: any) => (
    <div {...innerProps} className="flex items-center p-2 cursor-pointer hover:bg-blue-50">
      {getPaymentIcon(data.value)}
      <span className="ml-2">{label}</span>
    </div>
  );

  // Move customSelectStyles inside the component to access theme
  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      background: theme === 'dark' ? '#374151' : 'white',
      borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
      '&:hover': {
        borderColor: theme === 'dark' ? '#6B7280' : '#9CA3AF',
      },
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
    }),
    menu: (base: any) => ({
      ...base,
      background: theme === 'dark' ? '#1F2937' : 'white',
      borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused
        ? theme === 'dark' ? '#374151' : '#EFF6FF'
        : theme === 'dark' ? '#1F2937' : 'white',
      color: theme === 'dark' ? '#E5E7EB' : '#111827',
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#374151' : '#EFF6FF',
      },
      display: 'flex',
      alignItems: 'center',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: theme === 'dark' ? '#E5E7EB' : '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }),
    input: (base: any) => ({
      ...base,
      color: theme === 'dark' ? '#E5E7EB' : '#111827',
    }),
  };

  // Update the CountryOption component
  const CountryOption = ({ innerProps, label, data }: any) => (
    <div
      {...innerProps}
      className="flex items-center p-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <img
        src={data.flag}
        alt={`${label} flag`}
        className="w-5 h-4 mr-2 object-cover rounded-sm"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/No_flag.svg/2048px-No_flag.svg.png';
        }}
      />
      <span className="text-gray-900 dark:text-gray-100">{label}</span>
    </div>
  );

  // Update the SingleValue component
  const SingleValue = ({ children, ...props }: any) => (
    <div className="flex items-center">
      <img
        src={props.data.flag}
        alt={`${children} flag`}
        className="w-5 h-4 mr-2 object-cover rounded-sm"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/No_flag.svg/2048px-No_flag.svg.png';
        }}
      />
      <span>{children}</span>
    </div>
  );

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
      case 'amex':
      case 'mastercard':
      case 'visa':
        return <CreditCard className="w-5 h-5" />;
      case 'paypal':
      case 'google_pay':
      case 'apple_pay':
      case 'samsung_pay':
      case 'alipay':
      case 'wechat_pay':
      case 'venmo':
        return <Wallet className="w-5 h-5" />;
      case 'bank_transfer':
      case 'wire_transfer':
      case 'sepa':
      case 'ach':
        return <Building2 className="w-5 h-5" />;
      case 'bitcoin':
      case 'ethereum':
      case 'usdt':
      case 'usdc':
        return <Bitcoin className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  // Custom notification styles
  const notifySuccess = (message: string) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: {
        backgroundColor: '#10B981',
        color: 'white',
        fontSize: '14px',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    });
  };

  const notifyError = (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: {
        backgroundColor: '#EF4444',
        color: 'white',
        fontSize: '14px',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    });
  };

  const notifyWarning = (message: string) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: {
        backgroundColor: '#F59E0B',
        color: 'white',
        fontSize: '14px',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    });
  };

  // Add this component for payment type option
  const PaymentTypeOption = ({ innerProps, label, data }: any) => (
    <div
      {...innerProps}
      className="flex items-center p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <div className="flex items-center w-full">
        {getPaymentIcon(data.value)}
        <span className="ml-2 text-gray-900 dark:text-gray-100">{label}</span>
      </div>
    </div>
  );

  // Add this component for payment type single value
  const PaymentTypeSingleValue = ({ children, ...props }: any) => (
    <components.SingleValue {...props}>
      <div className="flex items-center">
        {getPaymentIcon(props.data.value)}
        <span className="ml-2">{children}</span>
      </div>
    </components.SingleValue>
  );

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your financial transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${showFilters
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
          >
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            Filters
          </button>
          {isAdmin &&
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  clientName: '',
                  clientCountry: null,
                  amount: '',
                  paymentType: null,
                  date: new Date(),
                  note: '',
                  userName: null
                });
                setIsOpen(true);
              }}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
              ${isAdmin
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'}`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Transaction
            </button>
          }
        </div>
      </div>

      {/* Filters Panel with Animation */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Client Name Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
                <User className="w-4 h-4 mr-2" />
                Client Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filterData.clientName}
                  onChange={(e) => setFilterData({ ...filterData, clientName: e.target.value })}
                  placeholder="Search by name..."
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
                <Globe className="w-4 h-4 mr-2" />
                Country
              </label>
              <Select
                options={countries}
                value={filterData.clientCountry}
                onChange={(value) => setFilterData({ ...filterData, clientCountry: value })}
                styles={customSelectStyles}
                components={{ Option: CountryOption, SingleValue }}
                isSearchable
                isClearable
                placeholder="Filter by country"
                className="text-sm"
              />
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </label>
              <div className="flex space-x-2">
                <DatePicker
                  selected={filterData.startDate}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={filterData.startDate}
                  endDate={filterData.endDate}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholderText="Start date"
                />
                <DatePicker
                  selected={filterData.endDate}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={filterData.startDate || undefined}
                  endDate={filterData.endDate || undefined}
                  minDate={filterData.startDate || undefined}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholderText="End date"
                />
              </div>
            </div>

            {/* Amount Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
                <DollarSign className="w-4 h-4 mr-2" />
                Amount Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Min amount"
                  value={filterData.minAmount}
                  onChange={(e) => setFilterData({ ...filterData, minAmount: e.target.value })}
                />
                <input
                  type="number"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Max amount"
                  value={filterData.maxAmount}
                  onChange={(e) => setFilterData({ ...filterData, maxAmount: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Client Name
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Country
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Receipt className="w-4 h-4 mr-2" />
                    Amount
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Type
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Date
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Note
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    User Name
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentItems.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <img
                        src={`https://flagcdn.com/w20/${transaction.clientCountry.toLowerCase()}.png`}
                        alt={`${transaction.clientCountry} flag`}
                        className="w-5 h-4 mr-2 object-cover rounded-sm"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/No_flag.svg/2048px-No_flag.svg.png';
                        }}
                      />
                      <span>
                        {countries.find(c => c.value === transaction.clientCountry.toLowerCase())?.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                    ${transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      {getPaymentIcon(transaction.paymentType)}
                      <span className="ml-2">
                        {paymentTypes.find(pt => pt.value === transaction.paymentType)?.label || transaction.paymentType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap" title={transaction.note}>
                      {transaction.note}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} entries
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 border rounded-md ${currentPage === page ? 'bg-blue-600 text-white' : ''
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add/Edit Transaction Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-visible rounded-2xl 
                                      bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all
                                      relative z-10">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                  >
                    {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        User Name
                      </label>
                      <Select<User>
                        value={formData.userName}
                        onChange={(option) => setFormData(prev => ({ ...prev, userName: option }))}
                        options={users}
                        styles={{
                          ...customSelectStyles,
                          option: (base: any, state: any) => ({
                            ...base,
                            backgroundColor: state.isFocused
                              ? theme === 'dark' ? '#374151' : '#EFF6FF'
                              : theme === 'dark' ? '#1F2937' : 'white',
                            color: theme === 'dark' ? '#E5E7EB' : '#111827',
                            '&:hover': {
                              backgroundColor: theme === 'dark' ? '#374151' : '#EFF6FF',
                            },
                            padding: '8px 12px',
                          }),
                          control: (base: any, state: any) => ({
                            ...base,
                            background: theme === 'dark' ? '#374151' : 'white',
                            borderColor: state.isFocused 
                              ? theme === 'dark' ? '#60A5FA' : '#3B82F6' 
                              : theme === 'dark' ? '#4B5563' : '#D1D5DB',
                            '&:hover': {
                              borderColor: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                            },
                            boxShadow: state.isFocused ? `0 0 0 2px ${theme === 'dark' ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.5)'}` : 'none',
                          }),
                        }}
                        className="mt-1"
                        classNamePrefix="select"
                        placeholder="Select user..."
                        isSearchable
                        required
                        isDisabled={!isAdmin}
                        noOptionsMessage={() => "No users found"}
                        formatOptionLabel={(option: User) => (
                          <div className="flex flex-col">
                            <span className="font-medium">{option.value}</span>
                            {option.email && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {option.email}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Client Name
                      </label>
                      <input
                        type="text"
                        required
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 text-sm font-medium text-gray-900 dark:text-gray-100 
                                 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Country
                      </label>
                      <Select
                        options={countries}
                        value={formData.clientCountry}
                        onChange={(value: SelectOption | null) => setFormData({ ...formData, clientCountry: value })}
                        styles={{
                          ...customSelectStyles,
                          option: (base: any, state: any) => ({
                            ...base,
                            backgroundColor: state.isFocused
                              ? theme === 'dark' ? '#374151' : '#EFF6FF'
                              : theme === 'dark' ? '#1F2937' : 'white',
                            color: theme === 'dark' ? '#E5E7EB' : '#111827',
                            '&:hover': {
                              backgroundColor: theme === 'dark' ? '#374151' : '#EFF6FF',
                            },
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                          }),
                          control: (base: any, state: any) => ({
                            ...base,
                            background: theme === 'dark' ? '#374151' : 'white',
                            borderColor: state.isFocused 
                              ? theme === 'dark' ? '#60A5FA' : '#3B82F6' 
                              : theme === 'dark' ? '#4B5563' : '#D1D5DB',
                            '&:hover': {
                              borderColor: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                            },
                            minHeight: '36px',
                            padding: '0 4px',
                            boxShadow: state.isFocused ? `0 0 0 2px ${theme === 'dark' ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.5)'}` : 'none',
                          }),
                          singleValue: (base: any) => ({
                            ...base,
                            display: 'flex',
                            alignItems: 'center',
                            color: theme === 'dark' ? '#E5E7EB' : '#111827',
                          }),
                          menuPortal: (base: any) => ({
                            ...base,
                            zIndex: 9999
                          }),
                          menu: (base: any) => ({
                            ...base,
                            zIndex: 9999,
                            backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                          })
                        }}
                        components={{
                          Option: CountryOption,
                          SingleValue
                        }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        isSearchable
                        placeholder="Select a country..."
                        className="text-sm"
                        required
                        maxMenuHeight={300}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount
                      </label>
                      <input
                        type="number"
                        required
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 text-sm font-medium text-gray-900 dark:text-gray-100 
                                 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </label>
                      <div className="relative mt-1">
                        <DatePicker
                          selected={formData.date}
                          onChange={(date: Date | null) => setFormData({ ...formData, date: date || new Date() })}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                   text-sm font-medium text-gray-900 dark:text-gray-100 
                                   bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          dateFormat="MMMM d, yyyy"
                          showPopperArrow={false}
                          calendarClassName="shadow-lg rounded-lg border border-gray-200 dark:border-gray-600 
                                          bg-white dark:bg-gray-800"
                          wrapperClassName="w-full"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-5 w-5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Payment Type
                      </label>
                      <Select
                        options={groupedPaymentTypes}
                        value={formData.paymentType}
                        onChange={(value) => setFormData({ ...formData, paymentType: value })}
                        styles={{
                          ...customSelectStyles,
                          menuPortal: (base: any) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                          menu: (base: any) => ({
                            ...base,
                            zIndex: 9999,
                            backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                          }),
                          option: (base: any, state: any) => ({
                            ...base,
                            backgroundColor: state.isFocused
                              ? theme === 'dark' ? '#374151' : '#EFF6FF'
                              : theme === 'dark' ? '#1F2937' : 'white',
                            color: theme === 'dark' ? '#E5E7EB' : '#111827',
                            '&:hover': {
                              backgroundColor: theme === 'dark' ? '#374151' : '#EFF6FF',
                            },
                            padding: '8px 12px',
                          }),
                          control: (base: any, state: any) => ({
                            ...base,
                            background: theme === 'dark' ? '#374151' : 'white',
                            borderColor: state.isFocused 
                              ? theme === 'dark' ? '#60A5FA' : '#3B82F6' 
                              : theme === 'dark' ? '#4B5563' : '#D1D5DB',
                            '&:hover': {
                              borderColor: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                            },
                            boxShadow: state.isFocused ? `0 0 0 2px ${theme === 'dark' ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.5)'}` : 'none',
                          }),
                          group: (base: any) => ({
                            ...base,
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            borderBottomWidth: '1px',
                            borderBottomStyle: 'solid',
                            borderBottomColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                          }),
                          groupHeading: (base: any) => ({
                            ...base,
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '8px',
                            padding: '8px 12px',
                          }),
                        }}
                        components={{
                          Option: PaymentTypeOption,
                          SingleValue: PaymentTypeSingleValue,
                        }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        isSearchable
                        placeholder="Select payment type..."
                        className="text-sm"
                        required
                        maxMenuHeight={300}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Note
                      </label>
                      <textarea
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 text-sm font-medium text-gray-900 dark:text-gray-100 
                                 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        rows={3}
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        placeholder="Enter any additional notes..."
                      />
                    </div>

                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        {isEditing ? 'Update Transaction' : 'Add Transaction'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 