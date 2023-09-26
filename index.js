// Required packages
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Express setup
const app = express();
app.use(express.json());
const port = 3000;

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

// RESTful routes

// GET - Fetch all reviews
app.get('/reviews', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM reviews');
    res.json(rows);
});

// POST - Add a new review
app.post('/reviews', express.json(), async (req, res) => {
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