import express from 'express';
import { pool } from '../index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

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
    if (!report_date || !working_hours) {
      return res.status(400).json({ message: 'Please provide date and working hours' });
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