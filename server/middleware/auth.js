import jwt from 'jsonwebtoken';
import { pool } from '../index.js';

export const auth = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add user to request object
    const { password, ...user } = users[0];
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Not authenticated' });
  }
};