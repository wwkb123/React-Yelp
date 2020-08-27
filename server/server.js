require('dotenv').config();
const express = require('express');
const cors = require("cors");
const db = require('./db');
const morgan = require('morgan');
const app = express();

// middleware
// app.use(morgan("dev"));

// app.use((req, res, next) => {
//     next(); // go to next function
// });

app.use(cors());
app.use(express.json())  // append a body attribute to post's req, which is a json object

// get all restaurants
app.get('/api/v1/restaurants', async (req, res) => {
    
    // const result = await db.query("SELECT * FROM restaurants");
    const restaurantRatingsData = await db.query(
        "select * from restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating),1) as average_rating from reviews group by restaurant_id) reviews on restaurants.id = reviews.restaurant_id;"
      );

    res.status(200).json({
        status: "success",
        result: restaurantRatingsData.rows.length,
        data: {
            restaurants: restaurantRatingsData.rows
        }
        
    });
});

// get a restaurant
app.get('/api/v1/restaurants/:id', async (req, res) => {
    
    // parameterized query, prevent query injection attack
    const reviews = await db.query("SELECT * FROM reviews WHERE restaurant_id = $1", [req.params.id]);
 
    const restaurant = await db.query(
        "SELECT * FROM restaurants LEFT JOIN (SELECT restaurant_id, COUNT(*), TRUNC(AVG(rating),1) AS average_rating FROM reviews GROUP BY restaurant_id) reviews ON restaurants.id = reviews.restaurant_id WHERE id = $1",
        [req.params.id]
      );
    res.status(200).json({
        status: "success",
        data: {
            restaurant: restaurant.rows[0],
            reviews: reviews.rows
        }
        
    });
});

// create a restaurant
app.post('/api/v1/restaurants', async (req, res) => {
    console.log("create a restaurant");
    const result = await db.query("INSERT INTO restaurants (name, location, price_range) VALUES ($1, $2, $3) RETURNING *", [req.body.name, req.body.location, req.body.price_range]);
    res.status(201).json({
        status: "success",
        data: {
            restaurant: result.rows[0]
        }
        
    });
});

// update a restaurant
app.put('/api/v1/restaurants/:id', async (req, res) => {
    console.log("update a restaurant " + req.params.id);
    const result = await db.query("UPDATE restaurants SET name = $1, location = $2, price_range = $3 WHERE id = $4 RETURNING *",[req.body.name, req.body.location, req.body.price_range, req.params.id])
    // console.log(req.body);
    res.status(200).json({
        status: "success",
        data: {
            restaurant: result.rows[0]
        }
        
    });
});

// delete a restaurant
app.delete('/api/v1/restaurants/:id', async (req, res) => {
    console.log("delete a restaurant " + req.params.id);
    const result = await db.query("DELETE FROM restaurants WHERE id = $1", [req.params.id])
    // console.log(req.body);
    res.status(204).json({
        status: "success"
    });
});

app.post('/api/v1/restaurants/:id/addReview', async (req, res) => {
    try{

    
    const result = await db.query("INSERT INTO reviews (restaurant_id, name, review, rating) VALUES ($1, $2, $3, $4) RETURNING *", [req.params.id, req.body.name, req.body.review, req.body.rating]);
    // console.log(req.body);
    res.status(201).json({
        status: "success",
        data: {
            review: result.rows[0]
        }
    });
    }catch(err){
        console.log(err);
    }
});


const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log('server is up. listening on port ' + port);
});