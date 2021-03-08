// regular imports;
const express = require('express');
const helmet = require('helmet');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');

// setting middlewares;
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cors());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// routes;
const users = require('./routes/users');
const stories = require('./routes/stories');
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
});

mongoose.set('useFindAndModify', false);
    
// Handling requests
app.get('/', (req, res) => {
    res.send("Hello!");
});


// setting up the server to listen;
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});