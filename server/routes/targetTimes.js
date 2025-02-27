import express from 'express';
import { pool } from '../index.js';
import { auth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = express.Router();

// Get target times
router.get('/', auth, async (req, res) => {
  try {
    const [targets] = await pool.query('SELECT * FROM target_working_times ORDER BY id DESC LIMIT 1');
    res.json(targets[0]);
  } catch (error) {
    console.error('Get target times error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update target times (admin only)
router.put('/', auth, adminOnly, async (req, res) => {
  try {
    const { weekday_target, weekend_target } = req.body;
    
    if (!weekday_target || !weekend_target) {
      return res.status(400).json({ message: 'Please provide both weekday and weekend targets' });
    }
    
    await pool.query(
      'UPDATE target_working_times SET weekday_target = ?, weekend_target = ?, updated_by = ?',
      [weekday_target, weekend_target, req.user.id]
    );
    
    res.json({ message: 'Target times updated successfully' });
  } catch (error) {
    console.error('Update target times error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 