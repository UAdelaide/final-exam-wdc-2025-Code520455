const express = require('express');
const router = express.Router();
const db = require('../models/db');

function authorization(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'UNAUTHORIZED ' });
}
router.get('/', authorization, async (req, res) => {
    const owner_id = req.session.user.id;

        if (!owner_id) {
            return res.status(400).json({ error: 'Owner id not exist in the session' });
        }
            try {
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
