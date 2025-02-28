
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle?: string;
}

const StatsCard = ({ icon: Icon, title, value, subtitle }: StatsCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className="flex-shrink-0 p-3 rounded-md bg-blue-50 text-blue-600">
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;