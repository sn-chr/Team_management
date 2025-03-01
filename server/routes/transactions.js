import express from 'express';
import { pool } from '../index.js';
const router = express.Router();

// Get all transactions
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT *, UPPER(client_country) as client_country FROM transactions ORDER BY transaction_date DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

// Get all users for the select box
router.get('/users', async (req, res) => {
    try {
        // Fetch only active users from the users table
        const [rows] = await pool.query(
            'SELECT id, name, email FROM users WHERE role = "user" ORDER BY name'
        );
        
        // Format the users for the select box
        const formattedUsers = rows.map(user => ({
            value: user.name,
            label: `${user.name} (${user.email})`,
            id: user.id
        }));
        res.json(formattedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Create a new transaction
router.post('/', async (req, res) => {
    try {
        const {
            clientName,
            clientCountry,
            amount,
            paymentType,
            date,
            note,
            userName
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO transactions (
                client_name,
                client_country,
                amount,
                payment_type,
                transaction_date,
                note,
                user_name
            ) VALUES (?, UPPER(?), ?, ?, ?, ?, ?)`,
            [clientName, clientCountry, amount, paymentType, new Date(date), note, userName]
        );

        const [newTransaction] = await pool.query(
            'SELECT *, UPPER(client_country) as client_country FROM transactions WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newTransaction[0]);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Error creating transaction' });
    }
});

// Get a single transaction
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT *, UPPER(client_country) as client_country FROM transactions WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ message: 'Error fetching transaction' });
    }
});

// Update a transaction
router.put('/:id', async (req, res) => {
    try {
        const {
            clientName,
            clientCountry,
            amount,
            paymentType,
            date,
            note,
            userName
        } = req.body;

        const [result] = await pool.query(
            `UPDATE transactions 
            SET client_name = ?,
                client_country = UPPER(?),
                amount = ?,
                payment_type = ?,
                transaction_date = ?,
                note = ?,
                user_name = ?
            WHERE id = ?`,
            [clientName, clientCountry, amount, paymentType, new Date(date), note, userName, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const [updatedTransaction] = await pool.query(
            'SELECT *, UPPER(client_country) as client_country FROM transactions WHERE id = ?',
            [req.params.id]
        );

        res.json(updatedTransaction[0]);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ message: 'Error updating transaction' });
    }
});

// Delete a transaction
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM transactions WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Error deleting transaction' });
    }
});

// Update the monthly earnings route
router.get('/monthly/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        const query = `
            SELECT 
                t.user_name,
                SUM(t.amount) as total_amount,
                COUNT(*) as transaction_count,
                u.target_money
            FROM transactions t
            LEFT JOIN users u ON t.user_name = u.name
            WHERE YEAR(t.created_at) = ? 
            AND MONTH(t.created_at) = ?
            GROUP BY t.user_name, u.target_money
            ORDER BY total_amount DESC
        `;

        const [rows] = await pool.query(query, [year, month]);
        
        // Calculate total earnings for all users
        const totalEarnings = rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
        const totalTarget = rows.reduce((sum, row) => sum + (parseFloat(row.target_money) || 0), 0);
        
        const monthlyData = {
            totalEarnings,
            totalTarget,
            userEarnings: rows.map(row => ({
                userName: row.user_name,
                amount: parseFloat(row.total_amount),
                target: parseFloat(row.target_money) || 0,
                transactionCount: row.transaction_count,
                progress: row.target_money ? (parseFloat(row.total_amount) / parseFloat(row.target_money) * 100).toFixed(1) : 0
            }))
        };

        res.json(monthlyData);
    } catch (error) {
        console.error('Error fetching monthly transactions:', error);
        res.status(500).json({ message: 'Error fetching monthly transactions' });
    }
});

// Add dashboard stats endpoint
router.get('/dashboard-stats/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;

        // Get total users
        const [userRows] = await pool.query(
            'SELECT COUNT(*) as total FROM users WHERE role = "user"'
        );
        const totalUsers = userRows[0].total;

        // Get monthly target (sum of all users' target_money)
        const [targetRows] = await pool.query(
            'SELECT SUM(target_money) as monthlyPlan FROM users WHERE role = "user"'
        );
        const monthlyPlan = parseFloat(targetRows[0].monthlyPlan) || 0;

        // Get current month's earnings and top user
        const query = `
            SELECT 
                t.user_name,
                SUM(t.amount) as total_amount
            FROM transactions t
            WHERE YEAR(t.created_at) = ? 
            AND MONTH(t.created_at) = ?
            GROUP BY t.user_name
            ORDER BY total_amount DESC
        `;

        const [transactionRows] = await pool.query(query, [year, month]);
        
        // Calculate total earnings and progress
        const totalEarnings = transactionRows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
        const monthlyProgress = monthlyPlan > 0 ? ((totalEarnings / monthlyPlan) * 100).toFixed(1) : 0;
        
        // Get top user (user with highest earnings this month)
        const topUser = transactionRows.length > 0 ? transactionRows[0].user_name : 'N/A';

        res.json({
            totalUsers,
            monthlyPlan,
            monthlyProgress,
            totalEarnings,
            topUser
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
});

export default router; 