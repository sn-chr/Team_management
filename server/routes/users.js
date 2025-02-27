import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../index.js';
import { auth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, target_money, created_at FROM users');
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new user (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, target_money = 3000.00 } = req.body;
    
    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ message: 'Role must be either "admin" or "user"' });
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, target_money) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, target_money]
    );
    
    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit a user (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, password, role, target_money } = req.body;
    
    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is already taken by another user
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email is already taken' });
    }
    
    // Update user
    if (password) {
      // If password is provided, update all fields including password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await pool.query(
        'UPDATE users SET name = ?, email = ?, password = ?, role = ?, target_money = ? WHERE id = ?',
        [name, email, hashedPassword, role, target_money, userId]
      );
    } else {
      // If no password provided, update all fields except password
      await pool.query(
        'UPDATE users SET name = ?, email = ?, role = ?, target_money = ? WHERE id = ?',
        [name, email, role, target_money, userId]
      );
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;