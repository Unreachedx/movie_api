const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'), // import built in node modules fs and path 
  path = require('path');

const app = express();
// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

// array of top 10 movies
const topMovies = [
  { title: 'Movie 1', year: '2000' },
  { title: 'Movie 2', year: '2001' },
  { title: 'Movie 3', year: '2002' },
  { title: 'Movie 4', year: '2003' },
  { title: 'Movie 5', year: '2004' },
  { title: 'Movie 6', year: '2005' },
  { title: 'Movie 7', year: '2006' },
  { title: 'Movie 8', year: '2007' },
  { title: 'Movie 9', year: '2008' },
  { title: 'Movie 10', year: '2009' },
];

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));

app.get('/', (req, res) => {
  res.send('Welcome to my movie app!');
});

app.get('/movies', (req, res) => {
  res.json(topMovies);
});

const bodyParser = require('body-parser'),
  methodOverride = require('method-override');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());

app.use((err, req, res, next) => {
  // logic
});

app.use(express.static('public'));

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});