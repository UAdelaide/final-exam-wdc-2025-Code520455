var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

let db;
(async () => {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password:''
        });

        // create database if it doesn't exist
        await connection.query('CREATE DATABASE IF NOT EXISTS dogwalks');
        await connection.end();

        // Now connect to the created database
        db = await mysql.createConnection({
            host:'localhost',
            user: 'root',
            password: '',
            database:'DogWalkService',
        });

        // create tables if it doesn't exist
        await db.execute(``);
    }
});


module.exports = app;
