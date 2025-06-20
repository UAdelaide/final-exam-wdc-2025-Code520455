const express = require('express');
const router = express.Router();
const db = require('../models/db');

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'NOT AUTHORIZED : Please login' });
}
router.get('/', isAuthenticated, async (req, res) => {
    const owner_id = req.session.user.id;
    try {
        if (!owner_id) {
            return res.status(400).json({ error: 'Owner id ' });
        }
        const [data] = await db.query(
            `SELECT name, dog_id, size FROM Dogs
            WHERE owner_id = ?
            `, [owner_id]);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Fail to fetch data from dog table' });
    }
});

module.exports = router;
