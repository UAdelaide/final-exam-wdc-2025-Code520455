var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
// const { error } = require('console');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

let db;
(async () => {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        // create database if it doesn't exist
        await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
        await connection.end();

        // Now connect to the created database
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DogWalkService'
        });

        // create tables if it doesn't exist
        // Users table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS Users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('owner', 'walker') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            `);
        // Dogs table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS Dogs (
            dog_id INT AUTO_INCREMENT PRIMARY KEY,
            owner_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            size ENUM('small', 'medium', 'large') NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES Users(user_id)
        )
        `);
        // WalkRequest Table
        await db.execute(`
        CREATE TABLE IF NOT EXISTS WalkRequests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        dog_id INT NOT NULL,
        requested_time DATETIME NOT NULL,
        duration_minutes INT NOT NULL,
        location VARCHAR(255) NOT NULL,
        status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id))`);

        // WalkApplications table
        await db.execute(`
        CREATE TABLE IF NOT EXISTS WalkApplications(
        application_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        walker_id INT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
        FOREIGN KEY (walker_id) REFERENCES Users(user_id),
        CONSTRAINT unique_application UNIQUE (request_id, walker_id))`);

        // WalkRatings table
        await db.execute(`
        CREATE TABLE IF NOT EXISTS WalkRatings (
        rating_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        walker_id INT NOT NULL,
        owner_id INT NOT NULL,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comments TEXT,
        rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
        FOREIGN KEY (walker_id) REFERENCES Users(user_id),
        FOREIGN KEY (owner_id) REFERENCES Users(user_id),
        CONSTRAINT unique_rating_per_walk UNIQUE (request_id))`);

    // Insert data if table is empty
    // adding data in users table
    const [rows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (rows[0].count === 0){
    // insert user data
      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('vicky', 'vicky@example.com', 'hashed321', 'walker'),
        ('eveowner', 'eve@example.com', 'hashed654', 'owner');

      `);

    // insert dogs data
      await db.execute(`
        INSERT INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Scotch', 'large'),
        ((SELECT user_id FROM Users WHERE username = 'eveowner'), 'Buku', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Kuku', 'small');

      `);


    // insert WalkRequests Data
      await db.execute(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Scotch'), '2025-06-11 10:00:00', 60, 'River Trail', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Buku'), '2025-06-12 14:00:00', 30, 'City Gardens', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Kuku'), '2025-06-13 17:00:00', 20, 'Sunset Park', 'open');
      `);
    }
} catch(err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
}
})();


// Route to return dogs as JSON
app.get('/api/dogs', async (req,res) => {
    try {
        const[dogs] = await db.execute('SELECT d.name AS dog_name , d.size, u.username AS owner_username FROM Dogs d JOIN Users u on d.owner_id = u.user_id');
        res.json(dogs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});


// Route to return walkrequests/open as JSON
app.get('/api/walkrequests/open', async (req,res) => {
    try {
        const[dogs] = await db.execute('SELECT WR.request_id, D.name AS dog_name, WR.requested_time, WR.duration_minutes, WR.location, U.username AS owner_username FROM WalkRequests WR JOIN Dogs D ON WR.dog_id = D.dog_id JOIN Users U ON D.owner_id = U.user_id Where WR.status = "open"');
        res.json(dogs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});

// Route to return summary

app.get('/api/walkers/summary', async (req,res) => {
    try {
        const[dogs] = await db.execute('SELECT U.username AS walker_username, COUNT(DISTINCT WR.request_id) AS completed_walks,COUNT(R.rating_id) AS total_ratings, ROUND(AVG(R.rating),1) AS average_rating FROM Users U LEFT JOIN WalkRequests WR ON U.user_id = R.walker_id LEFT JOIN WalkRequests WR ON R.request_id = WR.request_id AND WR.status = "completed" WHERE U.role = "walker" GROUP BY U.user_id');
        res.json(dogs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});
app.use(express.static(path.join(__dirname,'public')));

module.exports = app;
