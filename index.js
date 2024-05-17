const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Models = require('./models.js');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid'); // Require uuid
const methodOverride = require('method-override'); // Require methodOverride here
const Movies = Models.Movie;
const Users = Models.User;


mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

// Middleware setup
app.use(morgan('combined', { stream: fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' }) }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

/* // Array of users
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
]; */

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to my movie app!');
});

// Create new user
app.post('/users', async (req, res) => {
  await Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// Get all users
app.get('/users', async (req, res) => {
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
app.get('/users/:Username', async (req, res) => {
  const { Username } = req.params;
  const updatedUserData = req.body;

  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username },
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

app.put('/users/:Username', async (req, res) => {
  let { Username } = req.params;
  // Convert the username to lowercase and remove leading/trailing spaces
  Username = Username.trim().toLowerCase();

  const updatedUserData = req.body;

  try {
    const updatedUser = await Users.findOneAndUpdate(
      // Use a case-insensitive regex for matching the username
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
app.post('/users/:Username/favorites/:movieID', async (req, res) => {
  try {
    const { Username, movieID } = req.params;
    console.log('Username:', Username);
    console.log('movieID:', movieID);

    // Find the user by username and add the movie to favorites
    const updatedUser = await Users.findOneAndUpdate(
      { Username: Username },
      { $addToSet: { FavoriteMovies: movieID } },
      { new: true }
    );

    console.log('Updated user:', updatedUser); // Add this line

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
app.delete('/users/:Username/favorites/:movieID', async (req, res) => {
  try {
    const { Username, movieID } = req.params;
    console.log('Username:', Username);
    console.log('movieID:', movieID);

    // Find the user by username and remove the movie from favorites
    const updatedUser = await Users.findOneAndUpdate(
      { Username: Username },
      { $pull: { FavoriteMovies: movieID } }, // Use $pull to remove the movie from the array
      { new: true }
    );

    console.log('Updated user:', updatedUser); // Add this line

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
app.delete('/users/:Username', async (req, res) => {
  try {
    const { Username } = req.params;

    // Find and delete the user by username
    const deletedUser = await Users.findOneAndDelete({ Username: Username });

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
app.get('/movies', async (req, res) => {
  try {
    const movies = await Movies.find();
    res.status(200).json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// Read a specific movie by title
app.get('/movies/:title', async (req, res) => {
  const { title } = req.params;
  console.log('Searching for movie with title:', title);

  try {
    const movie = await Movies.findOne({ title: title });
    console.log('Found movie:', movie);

    if (movie) {
      res.status(200).json(movie);
    } else {
      console.log('Movie not found');
      res.status(404).send('Movie not found');
    }
  } catch (error) {
    console.error('Error retrieving movie:', error);
    res.status(500).send('Error: ' + error);
  }
});

app.get('/movies/genre/:genre', async (req, res) => {
  const { genre } = req.params;
  console.log('Searching for movies with genre:', genre);

  try {
    const moviesByGenre = await Movies.find({ genre: genre });
    console.log('Found movies:', moviesByGenre);

    if (moviesByGenre.length > 0) {
      res.status(200).json(moviesByGenre);
    } else {
      console.log('No movies found for the specified genre');
      res.status(404).send('No movies found for the specified genre');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

//Infos about Directors
app.get('/directors/:directorName', async (req, res) => {
  const { directorName } = req.params;
  console.log('Searching for director:', directorName);

  try {
    const moviesByDirector = await Movies.find({ 'director.name': directorName });
    console.log('Movies found:', moviesByDirector);

    if (moviesByDirector.length > 0) {
      const directorInfo = {
        name: directorName,
        movies: moviesByDirector.map(movie => movie.title)
      };
      console.log('Director information:', directorInfo);
      res.status(200).json(directorInfo);
    } else {
      console.log('No movies found for the specified director');
      res.status(404).send('No movies found for the specified director');
    }
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
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
