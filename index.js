// regular imports;
const express = require('express');
const helmet = require('helmet');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const config = require('config');

// setting middlewares;
const corsOptions = {
    origin: ['http://localhost:3000', 'https://www.telemetryblog.in']
}
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// routes;
const users = require('./routes/users');
const stories = require('./routes/stories');
const searchRouter = require('./routes/search');
app.use('/api/user', users);
app.use('/api/story', stories);
app.use('/api/search', searchRouter);

// connecting to the database;
let connectionString = '';

if (app.get('env') == 'development') {
    connectionString = 'mongodb://localhost/telemetry-blog';
}
else {
    connectionString = config.get('mongodbConnectionString');
}

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
.then(connected => {
    console.log("Connected to the database!");
})
.catch(err => {
    console.log("Couldn't connect to the database.");
})

console.log(app.get('env'), "connectionstring:\t", connectionString);

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