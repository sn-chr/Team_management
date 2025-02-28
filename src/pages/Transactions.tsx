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

interface Transaction {
  id: number;
  clientName: string;
  clientCountry: string;
  amount: number;
  paymentType: string;
  date: Date;
  note: string;
}

interface SelectOption {
  value: string;
  label: string;
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
}

// Custom styles for react-select
const customSelectStyles = {
  control: (base: any) => ({
    ...base,
    border: '1px solid #D1D5DB',
    borderRadius: '0.375rem',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#3B82F6'
    }
  }),
  option: (base: any, state: any) => ({
    ...base,
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    cursor: 'pointer',
    backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
    '&:hover': {
      backgroundColor: state.isSelected ? '#3B82F6' : '#EFF6FF'
    }
  })
};

// Custom country option component with flag
const CountryOption = ({ innerProps, label, data }: any) => (
  <div {...innerProps} className="flex items-center p-2 cursor-pointer hover:bg-blue-50">
    <img
      src={`https://flagcdn.com/24x18/${data.value.toLowerCase()}.png`}
      alt={label}
      className="mr-2 w-6 h-4 object-cover rounded-sm"
    />
    <span>{label}</span>
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

interface FilterData {
  clientName: string;
  clientCountry: SelectOption | null;
  startDate: Date | null;
  endDate: Date | null;
  minAmount: string;
  maxAmount: string;
}

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

export default function Transactions() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientCountry: null,
    amount: '',
    paymentType: null,
    date: new Date(),
    note: ''
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

  const countries = countryList().getData().map(country => ({
    ...country,
    value: country.value.toLowerCase()
  }));

  // Handle date range changes
  const handleStartDateChange = (date: Date | null) => {
    setFilterData(prev => ({
      ...prev,
      startDate: date,
      // Reset end date if it's before start date
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
      const response = await axios.get('http://localhost:3090/api/transactions', {
        withCredentials: true
      });
      const formattedTransactions = response.data.map((transaction: any) => ({
        id: transaction.id,
        clientName: transaction.client_name,
        clientCountry: transaction.client_country,
        amount: transaction.amount,
        paymentType: transaction.payment_type,
        date: new Date(transaction.transaction_date),
        note: transaction.note || ''
      }));
      setTransactions(formattedTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      notifyError(error.response?.data?.message || 'Failed to fetch transactions');
    }
  };

  useEffect(() => {
    fetchTransactions();
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
        note: formData.note
      };

      if (isEditing && editingId) {
        await axios.put(`http://localhost:3090/api/transactions/${editingId}`, transactionData, {
          withCredentials: true
        });
        notifySuccess('Transaction updated successfully');
      } else {
        await axios.post('http://localhost:3090/api/transactions', transactionData, {
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
      console.error('Error saving transaction:', error);
      notifyError(error.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    const countryOption = countries.find(c => c.value === transaction.clientCountry.toLowerCase());
    setFormData({
      clientName: transaction.clientName,
      clientCountry: countryOption || { 
        value: transaction.clientCountry.toLowerCase(), 
        label: transaction.clientCountry 
      },
      amount: transaction.amount.toString(),
      paymentType: paymentTypes.find(pt => pt.value === transaction.paymentType) || {
        value: transaction.paymentType,
        label: transaction.paymentType
      },
      date: new Date(transaction.date),
      note: transaction.note
    });
    setEditingId(transaction.id);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`http://localhost:3090/api/transactions/${id}`, {
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
      note: ''
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

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
              showFilters 
                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            Filters
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              resetForm();
              setIsOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </button>
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
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-6">
            {/* Client Name Filter */}
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-gray-700 flex items-center mb-2">
                <User className="w-4 h-4 mr-2" />
                Client Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={filterData.clientName}
                  onChange={(e) => setFilterData({ ...filterData, clientName: e.target.value })}
                  placeholder="Search by name..."
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Country Filter */}
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-gray-700 flex items-center mb-2">
                <Globe className="w-4 h-4 mr-2" />
                Country
              </label>
              <Select
                options={countries}
                value={filterData.clientCountry}
                onChange={(value) => setFilterData({ ...filterData, clientCountry: value })}
                styles={{
                  ...customSelectStyles,
                  container: (base) => ({
                    ...base,
                    flex: 1,
                  })
                }}
                components={{ Option: CountryOption }}
                isClearable
                placeholder="Filter by country"
              />
            </div>

            {/* Amount Range Filter */}
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-gray-700 flex items-center mb-2">
                <Receipt className="w-4 h-4 mr-2" />
                Amount Range
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={filterData.minAmount}
                    onChange={(e) => setFilterData({ ...filterData, minAmount: e.target.value })}
                    placeholder="Min"
                  />
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                <span className="text-gray-500">-</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={filterData.maxAmount}
                    onChange={(e) => setFilterData({ ...filterData, maxAmount: e.target.value })}
                    placeholder="Max"
                  />
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-gray-700 flex items-center mb-2">
                <Clock className="w-4 h-4 mr-2" />
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DatePicker
                    selected={filterData.startDate}
                    onChange={handleStartDateChange}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholderText="Start date"
                    isClearable
                    maxDate={filterData.endDate || undefined}
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                <span className="text-gray-500">-</span>
                <div className="relative flex-1">
                  <DatePicker
                    selected={filterData.endDate}
                    onChange={handleEndDateChange}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholderText="End date"
                    isClearable
                    minDate={filterData.startDate || undefined}
                    disabled={!filterData.startDate}
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      {/* Transactions Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={`https://flagcdn.com/24x18/${transaction.clientCountry.toLowerCase()}.png`}
                      alt={transaction.clientCountry}
                      className="mr-2 w-6 h-4 object-cover rounded-sm"
                    />
                    {countries.find(c => c.value === transaction.clientCountry.toLowerCase())?.label || transaction.clientCountry}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">${transaction.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getPaymentIcon(transaction.paymentType)}
                    <span className="ml-2">
                      {paymentTypes.find(pt => pt.value === transaction.paymentType)?.label || transaction.paymentType}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.note}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-800"
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
              className={`px-4 py-2 border rounded-md ${
                currentPage === page ? 'bg-blue-600 text-white' : ''
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
        <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
                  </Dialog.Title>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client Name</label>
                      <input
                        type="text"
                        required
                         className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <Select
                        options={countries}
                        value={formData.clientCountry}
                        onChange={(value: SelectOption | null) => setFormData({ ...formData, clientCountry: value })}
                        className="mt-1"
                        styles={customSelectStyles}
                        components={{ Option: CountryOption }}
                        isSearchable
                        placeholder="Select a country"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="number"
                        required
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                      <Select
                        options={groupedPaymentTypes}
                        value={formData.paymentType}
                        onChange={(value: SelectOption | null) => setFormData({ ...formData, paymentType: value })}
                        className="mt-1"
                        styles={customSelectStyles}
                        components={{ Option: PaymentOption }}
                        isSearchable
                        placeholder="Select payment type"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <div className="relative mt-1">
                        <DatePicker
                          selected={formData.date}
                          onChange={(date: Date | null) => setFormData({ ...formData, date: date || new Date() })}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full"
                          dateFormat="MMMM d, yyyy"
                          showPopperArrow={false}
                          calendarClassName="shadow-lg rounded-lg border border-gray-200"
                          wrapperClassName="w-full"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-5 w-5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Note</label>
                      <textarea
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full"
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