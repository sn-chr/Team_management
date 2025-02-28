export const timeFormat = {
  // Convert HH:MM to decimal hours (e.g., "09:20" -> 9.333...)
  toDecimal: (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid time format. Please use HH:MM format (e.g., 08:30)');
    }
    return Number((hours + (minutes / 60)).toFixed(3));
  },

  // Convert decimal hours to HH:MM (e.g., 9.333... -> "09:20")
  toHHMM: (decimal: number): string => {
    if (isNaN(decimal) || decimal < 0) return '-';
    
    const hours = Math.floor(decimal);
    const minutesDecimal = (decimal - hours) * 60;
    const minutes = Math.round(minutesDecimal);
    
    // Handle case where rounding minutes results in 60
    if (minutes === 60) {
      return `${(hours + 1).toString().padStart(2, '0')}:00`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },

  // Convert decimal back to exact minutes (e.g., 9.333... -> 20 minutes)
  getMinutesFromDecimal: (decimal: number): number => {
    return Math.round((decimal % 1) * 60);
  },

  // Validate time string format
  isValid: (timeStr: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  },

  // Add new method to handle time differences
  formatTimeDifference: (difference: number): string => {
    const isNegative = difference < 0;
    const absoluteDiff = Math.abs(difference);
    
    const hours = Math.floor(absoluteDiff);
    const minutes = Math.round((absoluteDiff - hours) * 60);
    
    // Handle case where rounding minutes results in 60
    if (minutes === 60) {
      return `${isNegative ? '-' : ''}${(hours + 1).toString().padStart(2, '0')}:00`;
    }
    
    return `${isNegative ? '-' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },
};
