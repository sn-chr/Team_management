
interface EarningChartProps {
  data: {
    userName: string;
    target: number;
    current: number;
  }[];
}

const EarningChart = ({ data }: EarningChartProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">Monthly Earning Chart</h2>
      </div>
      <div className="p-6">
        {/* Chart implementation will go here */}
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    {item.userName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {((item.current / item.target) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex h-4 mb-4 overflow-hidden bg-gray-200 rounded">
                <div
                  style={{ width: `${(item.current / item.target) * 100}%` }}
                  className="flex flex-col justify-center bg-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningChart;
