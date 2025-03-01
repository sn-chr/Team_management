import React, { useState, useEffect } from "react";
import axios from "axios";
import { Clock } from "lucide-react";
import { timeFormat } from "../utils/timeFormat";

interface TargetTimes {
  weekday_target: string;
  weekend_target: string;
}

const TargetTimeManagement = () => {
  const [targetTimes, setTargetTimes] = useState<TargetTimes>({
    weekday_target: "16:00",
    weekend_target: "08:00",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchTargetTimes = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/target-times", {
          withCredentials: true,
        });
        setTargetTimes({
          weekday_target: timeFormat.toHHMM(res.data.weekday_target),
          weekend_target: timeFormat.toHHMM(res.data.weekend_target),
        });
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch target times");
      } finally {
        setLoading(false);
      }
    };

    fetchTargetTimes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");

      if (
        !timeFormat.isValid(targetTimes.weekday_target) ||
        !timeFormat.isValid(targetTimes.weekend_target)
      ) {
        setError("Please enter time in HH:MM format (e.g., 08:30)");
        return;
      }

      const payload = {
        weekday_target: timeFormat.toDecimal(targetTimes.weekday_target),
        weekend_target: timeFormat.toDecimal(targetTimes.weekend_target),
      };

      await axios.put("http://localhost:5000/api/target-times", payload, {
        withCredentials: true,
      });

      setSuccess("Target times updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update target times");
    }
  };

  const handleTimeChange = (field: keyof TargetTimes, value: string) => {
    if (!/^[\d:]*$/.test(value)) return;

    let formattedValue = value.replace(/[^\d]/g, "");
    if (formattedValue.length > 2) {
      formattedValue = `${formattedValue.slice(0, 2)}:${formattedValue.slice(
        2,
        4
      )}`;
    }

    setTargetTimes((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
  };

  const handleTimeBlur = (field: keyof TargetTimes, value: string) => {
    if (!value) return;

    if (timeFormat.isValid(value)) {
      const [hours, minutes] = value.split(":");
      const formattedValue = `${hours.padStart(2, "0")}:${minutes.padStart(
        2,
        "0"
      )}`;
      setTargetTimes((prev) => ({
        ...prev,
        [field]: formattedValue,
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Target Time Management
        </h1>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-4 rounded-md">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="weekday_target"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Weekday Target Hours
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="weekday_target"
                  placeholder="HH:MM (e.g., 16:00)"
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  value={targetTimes.weekday_target}
                  onChange={(e) => handleTimeChange("weekday_target", e.target.value)}
                  onBlur={(e) => handleTimeBlur("weekday_target", e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="weekend_target"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Weekend Target Hours
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="weekend_target"
                  placeholder="HH:MM (e.g., 08:00)"
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  value={targetTimes.weekend_target}
                  onChange={(e) => handleTimeChange("weekend_target", e.target.value)}
                  onBlur={(e) => handleTimeBlur("weekend_target", e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm 
                       text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 
                       dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-blue-500 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TargetTimeManagement;
