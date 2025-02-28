import express from 'express';
import { pool } from '../index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Get total active users
    const [userCount] = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role != "admin"'
    );

    // Get total monthly plan (sum of target_money from all active users)
    const [monthlyPlan] = await pool.query(
      'SELECT SUM(target_money) as total FROM users WHERE role != "admin"'
    );

    // Get current month's top performer
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const [topUser] = await pool.query(
      `SELECT 
        u.name,
        SUM(r.working_hours) as total_hours
      FROM users u
      JOIN work_reports r ON u.id = r.user_id
      WHERE 
        DATE_FORMAT(r.report_date, '%Y-%m') = ?
        AND u.role != 'admin'
      GROUP BY u.id, u.name
      ORDER BY total_hours DESC
      LIMIT 1`,
      [currentMonth]
    );

    // Calculate monthly progress
    const [monthlyProgress] = await pool.query(
      `SELECT 
        (SUM(r.working_hours) / (
          SELECT SUM(
            CASE 
              WHEN DAYOFWEEK(dates.date) = 1 THEN 8  -- Sunday
              ELSE 16                                 -- Other days
            END
          )
          FROM (
            SELECT DATE_ADD(DATE_SUB(LAST_DAY(?), INTERVAL DAY(LAST_DAY(?)) - 1 DAY),
                   INTERVAL numbers.n - 1 DAY) as date
            FROM (
              SELECT ones.n + tens.n * 10 + 1 as n
              FROM
                (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
                (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) tens
              WHERE ones.n + tens.n * 10 < DAY(LAST_DAY(?))
            ) numbers
          ) dates
          WHERE DAYOFWEEK(dates.date) NOT IN (7)  -- Exclude Saturday
        )) * 100 as progress
      FROM work_reports r
      WHERE DATE_FORMAT(r.report_date, '%Y-%m') = ?`,
      [currentMonth, currentMonth, currentMonth, currentMonth]
    );

    res.json({
      totalUsers: userCount[0].total,
      monthlyPlan: monthlyPlan[0].total || 0,
      monthlyProgress: Math.round(monthlyProgress[0].progress || 0),
      topUser: topUser[0]?.name || 'N/A'
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;