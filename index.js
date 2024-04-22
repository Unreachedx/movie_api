const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const bodyParser = require('body-parser'); // Require bodyParser here
const methodOverride = require('method-override'); // Require methodOverride here

const app = express();

// Middleware setup
app.use(morgan('combined', { stream: fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' }) }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());

// Array of users
const users = [
  {
    id: 1,
    name: "Daniel",
    favoriteMovies:[]
},
{
    id: 2,
    name: "John",
    favoriteMovies:["The Shawshank Redemption", "The Godfather"]
    }
];

// Create new user
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send('Users need names');
  }
});

// Update

app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find(user => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('User not found');
  }
});

// CREATE
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;


  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} added to ${id}'s favorite movies`);
  } else {
    res.status(400).send('User not found');
  }
});

// DELETE
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;


  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter(movie => movie !== movieTitle);
    res.status(200).send(`${movieTitle} has been removed from ${id}'s favorite movies`);
  } else {
    res.status(400).send('User not found');
  }
});

// DELETE
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  // Find the user with the specified id
  const userIndex = users.findIndex(user => user.id === id);

  if (userIndex !== -1) {
    // Remove the user from the users array
    users.splice(userIndex, 1);
    res.status(200).json(users); // Send updated list of users
    // res.status(200).send(`User ${id} has been deleted`); // Optional response
  } else {
    res.status(404).send('User not found'); // User with the specified id not found
  }
});



// Array of movies
const movies = [
  {
    "Name": "The Shawshank Redemption",
    "Title": "The Shawshank Redemption",
    "Director": "Frank Darabont",
    "Genre": "Drama"
  },
  {
    "Name": "The Godfather",
    "Title": "The Godfather",
    "Director": "Francis Ford Coppola",
    "Genre": "Crime"
  },
  {
    "Name": "The Dark Knight",
    "Title": "The Dark Knight",
    "Director": "Christopher Nolan",
    "Genre": "Action"
  },
  {
    "Name": "Pulp Fiction",
    "Title": "Pulp Fiction",
    "Director": "Quentin Tarantino",
    "Genre": "Crime"
  },
  {
    "Name": "The Lord of the Rings: The Return of the King",
    "Title": "The Lord of the Rings: The Return of the King",
    "Director": "Peter Jackson",
    "Genre": "Fantasy"
  },
  {
    "Name": "Forrest Gump",
    "Title": "Forrest Gump",
    "Director": "Robert Zemeckis",
    "Genre": "Drama"
  },
  {
    "Name": "Inception",
    "Title": "Inception",
    "Director": "Christopher Nolan",
    "Genre": "Sci-Fi"
  },
  {
    "Name": "The Matrix",
    "Title": "The Matrix",
    "Director": "The Wachowskis",
    "Genre": "Sci-Fi"
  },
  {
    "Name": "Schindler's List",
    "Title": "Schindler's List",
    "Director": "Steven Spielberg",
    "Genre": "Drama"
  },
  {
    "Name": "Fight Club",
    "Title": "Fight Club",
    "Director": "David Fincher",
    "Genre": "Drama"
  }
];

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to my movie app!');
});

// Read a list of movies
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});

// Get a movie by title
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  const movie = movies.find(move => move.Title === title).Title;

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(404).send('Movie not found');
  }
});

// Get movies by genre
app.get('/movies/genre/:genre', (req, res) => {
  const { genre } = req.params;
  const moviesByGenre = movies.filter(movie => movie.Genre === genre);

  if (moviesByGenre.length > 0) {
    res.status(200).json(moviesByGenre);
  } else {
    res.status(404).send('No movies found for the specified genre');
  }
});

// Search for a movie by director's name
app.get('/movies/directors/:directorName', (req, res) => {
  const { directorName } = req.params;
  const moviesByDirector = movies.filter(movie => movie.Director === directorName);

  if (moviesByDirector.length > 0) {
    res.status(200).json(moviesByDirector);
  } else {
    res.status(404).send('No movies found for the specified director');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Static files
app.use(express.static('public'));

// Start the server
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
