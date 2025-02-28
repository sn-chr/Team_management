import express from 'express';
import { pool } from '../index.js';
import { auth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = express.Router();

// Add time format validation helper
const isValidTimeFormat = (timeStr) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
};

// Add the weekly route BEFORE the /:userId route
router.get('/weekly', auth, async (req, res) => {
  try {
    // Get the date from query params or use current date
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    
    // Calculate start and end of week
    const startOfWeek = new Date(targetDate);
    startOfWeek.setHours(0, 0, 0, 0);
    // Get Monday (1) of the week
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get all reports for the current week with user information and total hours
    const [reports] = await pool.query(
      `SELECT 
        r.id,
        r.user_id,
        r.working_hours,
        r.report_date,
        u.name as user_name,
        DATE_FORMAT(r.report_date, '%a') as day_name,
        SUM(r.working_hours) OVER (PARTITION BY r.user_id) as total_hours
      FROM work_reports r
      JOIN users u ON r.user_id = u.id
      WHERE r.report_date >= ? AND r.report_date <= ?
      ORDER BY total_hours DESC, u.name`,
      [startOfWeek.toISOString(), endOfWeek.toISOString()]
    );

    // Get all users with their total hours for the week
    const [users] = await pool.query(
      `SELECT 
        u.id, 
        u.name,
        COALESCE(SUM(r.working_hours), 0) as total_hours
      FROM users u
      LEFT JOIN work_reports r ON u.id = r.user_id 
        AND r.report_date >= ? 
        AND r.report_date <= ?
      WHERE u.role != 'admin'
      GROUP BY u.id, u.name
      ORDER BY total_hours DESC, u.name`,
      [startOfWeek.toISOString(), endOfWeek.toISOString()]
    );

    // Process the data into the required format
    const weeklyData = users.map(user => {
      const userReports = reports.filter(report => report.user_id === user.id);
      const weeklyHours = {
        Mon: null,
        Tue: null,
        Wed: null,
        Thu: null,
        Fri: null,
        Sat: null,
        Sun: null
      };

      // Fill in the hours for days that have reports
      userReports.forEach(report => {
        const dayName = report.day_name;
        if (dayName) {
          weeklyHours[dayName] = Number(report.working_hours);
        }
      });

      return {
        userId: user.id,
        userName: user.name,
        weeklyHours,
        totalHours: Number(user.total_hours) // Add total hours to the response
      };
    });

    // Sort by total hours
    weeklyData.sort((a, b) => b.totalHours - a.totalHours);
    res.json(weeklyData);

  } catch (error) {
    console.error('Get weekly reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reports (for logged-in user or admin)
router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Only allow users to view their own reports unless they're an admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Not authorized to view these reports' });
    }
    
    const [reports] = await pool.query(
      `SELECT r.*, u.name as user_name 
       FROM work_reports r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.user_id = ? 
       ORDER BY r.report_date DESC`,
      [userId]
    );
    
    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new report
router.post('/', auth, async (req, res) => {
  try {
    const { report_date, working_hours, description } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!report_date || working_hours === undefined) {
      return res.status(400).json({ message: 'Please provide date and working hours' });
    }

    if (working_hours < 0 || working_hours > 24) {
      return res.status(400).json({ message: 'Working hours must be between 0 and 24' });
    }
    
    // Check if report already exists for this date
    const [existingReports] = await pool.query(
      'SELECT * FROM work_reports WHERE user_id = ? AND report_date = ?',
      [userId, report_date]
    );
    
    if (existingReports.length > 0) {
      return res.status(400).json({ message: 'A report already exists for this date' });
    }
    
    // Create report
    await pool.query(
      'INSERT INTO work_reports (user_id, report_date, working_hours, description) VALUES (?, ?, ?, ?)',
      [userId, report_date, working_hours, description]
    );
    
    res.status(201).json({ message: 'Report added successfully' });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a report
router.put('/:id', auth, async (req, res) => {
  try {
    const reportId = req.params.id;
    const { working_hours, description } = req.body;
    
    // Check if report exists and belongs to user
    const [reports] = await pool.query(
      'SELECT * FROM work_reports WHERE id = ? AND user_id = ?',
      [reportId, req.user.id]
    );
    
    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found or unauthorized' });
    }
    
    // Update report
    await pool.query(
      'UPDATE work_reports SET working_hours = ?, description = ? WHERE id = ?',
      [working_hours, description, reportId]
    );
    
    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a report
router.delete('/:id', auth, async (req, res) => {
  try {
    const reportId = req.params.id;
    
    // Check if report exists and belongs to user
    const [reports] = await pool.query(
      'SELECT * FROM work_reports WHERE id = ? AND user_id = ?',
      [reportId, req.user.id]
    );
    
    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found or unauthorized' });
    }
    
    // Delete report
    await pool.query('DELETE FROM work_reports WHERE id = ?', [reportId]);
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 