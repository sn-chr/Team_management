
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { timeFormat } from '../../utils/timeFormat';

interface WorkingTimeData {
  userId: number;
  userName: string;
  weeklyHours: {
    [key: string]: number | null; // e.g., { 'Mon': 8, 'Tue': 7.5, ... }
  };
  totalHours: number;
}

interface WeeklyWorkingTimeTableProps {
  data: WorkingTimeData[];
  loading?: boolean;
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
}

const WeeklyWorkingTimeTable = ({ data, loading, currentWeek, onWeekChange }: WeeklyWorkingTimeTableProps) => {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Ensure data is valid
  const validData = Array.isArray(data) ? data : [];

  // Get start and end dates of the current week
  const startOfWeek = new Date(currentWeek);
  startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + (currentWeek.getDay() === 0 ? -6 : 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Generate array of dates for the week
  const weekDates = weekDays.map((_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return date;
  });

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(currentWeek.getDate() - 7);
    onWeekChange(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    onWeekChange(nextWeek);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">Weekly Working Time</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevWeek}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextWeek}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              {weekDays.map((day, index) => (
                <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>{day}</div>
                  <div className="text-gray-400">
                    ({weekDates[index].getDate()})
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {validData.map((user) => (
              <tr key={user.userId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.userName}
                </td>
                {weekDays.map(day => {
                  const hours = user.weeklyHours[day];
                  const validHours = hours !== null && !isNaN(hours) ? hours : null;
                  
                  return (
                    <td 
                      key={day} 
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        validHours === null 
                          ? 'text-gray-400' 
                          : day === 'Sun' 
                            ? validHours >= timeFormat.toDecimal('08:00') ? 'text-green-600' : 'text-yellow-600'
                            : validHours >= timeFormat.toDecimal('16:00') ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {validHours === null ? '-' : timeFormat.toHHMM(validHours)}
                    </td>
                  );
                })}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {timeFormat.toHHMM(user.totalHours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyWorkingTimeTable;