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

// Create a new transaction
router.post('/', async (req, res) => {
    try {
        const {
            clientName,
            clientCountry,
            amount,
            paymentType,
            date,
            note
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO transactions (
                client_name,
                client_country,
                amount,
                payment_type,
                transaction_date,
                note
            ) VALUES (?, UPPER(?), ?, ?, ?, ?)`,
            [clientName, clientCountry, amount, paymentType, new Date(date), note]
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
            note
        } = req.body;

        const [result] = await pool.query(
            `UPDATE transactions 
            SET client_name = ?,
                client_country = UPPER(?),
                amount = ?,
                payment_type = ?,
                transaction_date = ?,
                note = ?
            WHERE id = ?`,
            [clientName, clientCountry, amount, paymentType, new Date(date), note, req.params.id]
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

export default router; 