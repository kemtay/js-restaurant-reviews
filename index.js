// Required packages
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Express setup
const app = express();
app.use(express.json());
const port = 3000;

// JWT - generate access token when user log in
function generateToken(userId, role) {
    // 1st argu: payload
    // 2nd argu: JWT_SECRET
    // 3rd argu: expiry and other metadata
    return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// JWT - verify toekn when user requests for a protected resource
function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];  // there is a space in the header, hence have use split to get the second part of the string
    if (!token) {
        return res.status(403).send('No token provided');
    }
    // verify the token is valid
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Failed to authenticate token');
        }
        //if no error
        req.userId = decoded.id;
        req.role = decoded.role;
        next();    // IMPORTANT: transfer the control to the next middleware
    });
}

function requireRole(role) {
    return function(req, res, next) {
        if (req.role !== role) {
            return res.status(403).send('Permission denied');
        }
        next();
    }
}

//console.log(process.env)
// initialise/setup the database
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0    // 0 means inifinte queue
});

app.get("/", function(req,res){
	res.send("restaurant review");
});

// RESTful routes with JWT
// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (user && user.password === password) {
        const token = generateToken(user.id, user.role);
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// RESTful routes

// GET - Fetch all reviews
app.get('/reviews', verifyToken, async (req, res) => {
//app.get('/reviews', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM reviews');
    res.json(rows);
});

// POST - Add a new review
app.post('/reviews', verifyToken, express.json(), async (req, res) => {
    const { restaurant_name, review_text, rating, user_id } = req.body;
    await pool.execute('INSERT INTO reviews (restaurant_name, review_text, rating, id) VALUES (?, ?, ?, ?)', [restaurant_name, review_text, rating, user_id]);
    res.status(201).send('Review added');
});

// PUT - Update a review
app.put('/reviews/:id', express.json(), async (req, res) => {
    const id = req.params.id;
    const { restaurant_name, review_text, rating } = req.body;
    await pool.execute('UPDATE reviews SET restaurant_name = ?, review_text = ?, rating = ? WHERE id = ?', [restaurant_name, review_text, rating, id]);
    res.send('Review updated');
});

// DELETE - Delete a review
app.delete('/reviews/:id', async (req, res) => {
    const id = req.params.id;
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
    res.send('Review deleted');
});

// start server
app.listen(8080, function(){
    console.log("Express server has started");
})