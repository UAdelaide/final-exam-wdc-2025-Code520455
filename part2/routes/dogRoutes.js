const express = require('express');
const router = express.Router();
const db = require('../models/db');

function is_authenticated(req, res, next){
    if(req.session && req.session.user){
        return next();
    }
    res.status(401).json({ error:'NOT AUTHORIZED : Please login'});
}
router.get('/mine', is_authenticated, async(req,res)=> {
    const owner_id = req.session.user.id;
    try{
        if(!owner_id){
            return res.status(400).json({error:'Owner ID is not found in session'});
        }
    }
}