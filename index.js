const { urlencoded } = require('express');
const express = require('express');
const helmet = require('helmet');
const app = express();
const users = require('./routes/users');
const stories = require('./routes/stories');
const mongoose = require('mongoose');

// setting middlewares;
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());

// routes;
app.use('/api/user', users);
app.use('/api/story', stories);

// connecting to the database;
const connectionString = 'mongodb://localhost/telemetry-blog';
mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.log("The following error occured:\n", err);
    } else {
        console.log("Connected to the dev database!");
    }
})
    
// Handling requests
app.get('/', (req, res) => {
    res.send("Hello!");
});


// setting up the server to listen;
const port = process.env.PORT || 3000;
app.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on port ${port}`);
});