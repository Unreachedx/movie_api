const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Models = require('./models.js');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const app = express();

const Movies = Models.Movie;
const Users = Models.User;

const auth = require('./auth')(app);
const passport = require('passport');
require('./passport');


mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware setup
app.use(morgan('combined', { stream: fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' }) }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to my movie app!');
});

// Create new user
app.post('/users', [
  check('Username', 'Username is required').isLength({ min: 5 }),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.Password);
  await Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users.create({
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        })
          .then((user) => { res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { Username } = req.params;

  try {
    const user = await Users.findOne({ Username: Username });
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json(user);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error: ' + error);
  }
});

// Update user by username
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { Username } = req.params;
  const updatedUserData = req.body;

  if (req.user.Username !== Username) {
    return res.status(400).send('Permission denied');
  }

  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: { $regex: new RegExp(`^${Username}$`, 'i') } },
      updatedUserData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error: ' + error);
  }
});

// Allow users to add a movie to their list of favorites
app.post('/users/:Username/favorites/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { Username, movieID } = req.params;

  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username },
      { $addToSet: { FavoriteMovies: movieID } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// Allow users to remove a movie from their list of favorites
app.delete('/users/:Username/favorites/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { Username, movieID } = req.params;

  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username },
      { $pull: { FavoriteMovies: movieID } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { Username } = req.params;

  try {
    const deletedUser = await Users.findOneAndDelete({ Username });

    if (!deletedUser) {
      return res.status(404).send('User not found');
    }

    res.status(200).json(deletedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// Read a list of movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movies.find();
    res.status(200).json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// Read a specific movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { title } = req.params;

  try {
    const movie = await Movies.findOne({ title });
    if (!movie) {
      return res.status(404).send('Movie not found');
    }
    res.status(200).json(movie);
  } catch (error) {
    console.error('Error retrieving movie:', error);
    res.status(500).send('Error: ' + error);
  }
});

// Read movies by genre
app.get('/movies/genre/:genre', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { genre } = req.params;

  try {
    const moviesByGenre = await Movies.find({ genre });
    if (moviesByGenre.length === 0) {
      return res.status(404).send('No movies found for the specified genre');
    }
    res.status(200).json(moviesByGenre);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// Infos about Directors
app.get('/directors/:directorName' , passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { directorName } = req.params;

  try {
    const moviesByDirector = await Movies.find({ 'director.name': directorName });
    if (moviesByDirector.length === 0) {
      return res.status(404).send('No movies found for the specified director');
    }

    const directorInfo = {
      name: directorName,
      movies: moviesByDirector.map(movie => movie.title)
    };
    res.status(200).json(directorInfo);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
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
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});
