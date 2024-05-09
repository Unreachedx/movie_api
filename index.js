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
  await Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
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

// Update a user's info, by username
// We’ll expect JSON in this format
app.put('/users/:Username', async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
    {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true }) // This line makes sure that the updated document is returned
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  })
});


// Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.params.Username }, {
     $addToSet: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }) // This line makes sure that the updated document is returned
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
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

// Delete a user by username
app.delete('/users/:Username', async (req, res) => {
  await Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});



/* // Array of movies
const movies = [
    {
      "Name": "The Shawshank Redemption",
      "Title": "The Shawshank Redemption",
      "Director": {
        "Name": "Frank Darabont",
        "Bio": "Frank Darabont is a Hungarian-American film director, screenwriter, and producer. He is best known for his adaptations of Stephen King novels, including 'The Shawshank Redemption' and 'The Green Mile.'",
        "BirthYear": 1959
      },
      "Genre": "Drama"
    },
    {
      "Name": "The Godfather",
      "Title": "The Godfather",
      "Director": {
        "Name": "Francis Ford Coppola",
        "Bio": "Francis Ford Coppola is an American film director, producer, and screenwriter. He is best known for directing 'The Godfather' trilogy and 'Apocalypse Now.'",
        "BirthYear": 1939
      },
      "Genre": "Crime"
    },
    {
      "Name": "The Dark Knight",
      "Title": "The Dark Knight",
      "Director": {
        "Name": "Christopher Nolan",
        "Bio": "Christopher Nolan is a British-American film director, producer, and screenwriter. He is known for his complex narratives and innovative storytelling techniques in films such as 'Inception,' 'Interstellar,' and 'The Dark Knight' trilogy.",
        "BirthYear": 1970
      },
      "Genre": "Action"
    },
    {
      "Name": "Pulp Fiction",
      "Title": "Pulp Fiction",
      "Director": {
        "Name": "Quentin Tarantino",
        "Bio": "Quentin Tarantino is an American filmmaker and actor. Known for his nonlinear storytelling and stylized violence, Tarantino has directed critically acclaimed films such as 'Pulp Fiction,' 'Kill Bill,' and 'Django Unchained.'",
        "BirthYear": 1963
      },
      "Genre": "Crime"
    },
    {
      "Name": "The Lord of the Rings: The Return of the King",
      "Title": "The Lord of the Rings: The Return of the King",
      "Director": {
        "Name": "Peter Jackson",
        "Bio": "Peter Jackson is a New Zealand film director, producer, and screenwriter. He is best known for his adaptation of J.R.R. Tolkien's 'The Lord of the Rings' trilogy, for which he won multiple Academy Awards.",
        "BirthYear": 1961
      },
      "Genre": "Fantasy"
    },
    {
      "Name": "Forrest Gump",
      "Title": "Forrest Gump",
      "Director": {
        "Name": "Robert Zemeckis",
        "Bio": "Robert Zemeckis is an American film director, producer, and screenwriter. He is known for blending visual effects with storytelling in films such as 'Forrest Gump,' the 'Back to the Future' trilogy, and 'Cast Away.'",
        "BirthYear": 1951
      },
      "Genre": "Drama"
    },
    {
      "Name": "Inception",
      "Title": "Inception",
      "Director": {
        "Name": "Christopher Nolan",
        "Bio": "Christopher Nolan is a British-American film director, producer, and screenwriter. He is known for his complex narratives and innovative storytelling techniques in films such as 'Inception,' 'Interstellar,' and 'The Dark Knight' trilogy.",
        "BirthYear": 1970
      },
      "Genre": "Sci-Fi"
    },
    {
      "Name": "The Matrix",
      "Title": "The Matrix",
      "Director": {
        "Name": "The Wachowskis",
        "Bio": "Lana Wachowski and Lilly Wachowski, known together professionally as the Wachowskis, are American film directors, producers, and screenwriters. They are best known for creating 'The Matrix' trilogy and 'Sense8.'",
        "BirthYear": 1965
      },
      "Genre": "Sci-Fi"
    },
    {
      "Name": "Schindler's List",
      "Title": "Schindler's List",
      "Director": {
        "Name": "Steven Spielberg",
        "Bio": "Steven Spielberg is an American filmmaker and producer. He is considered one of the founding pioneers of the New Hollywood era and has directed numerous critically acclaimed films, including 'Schindler's List,' 'Jurassic Park,' and 'Saving Private Ryan.'",
        "BirthYear": 1946
      },
      "Genre": "Drama"
    },
    {
      "Name": "Fight Club",
      "Title": "Fight Club",
      "Director": {
        "Name": "David Fincher",
        "Bio": "David Fincher is an American film director and producer. He is known for his meticulous attention to detail and his dark, psychological thrillers such as 'Fight Club,' 'Seven,' and 'Gone Girl.'",
        "BirthYear": 1962
      },
      "Genre": "Drama"
    }
  ] */

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to my movie app!');
});

// Read a list of movies
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});

// Get a movie by title
app.get('/movies/:title', async (req, res) => {
  const { title } = req.params;

  try {
    const movie = await Movies.findOne({ Title: title });

    if (movie) {
      res.status(200).json(movie);
    } else {
      res.status(404).send('Movie not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// Get movies by genre
app.get('/movies/genre/:genre', async (req, res) => {
  const { genre } = req.params;

  try {
    const moviesByGenre = await Movies.find({ 'Genre.Name': genre });

    if (moviesByGenre.length > 0) {
      res.status(200).json(moviesByGenre);
    } else {
      res.status(404).send('No movies found for the specified genre');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// Search for a movie by director's name
app.get('/movies/directors/:directorName', async (req, res) => {
  const { directorName } = req.params;

  try {
    const moviesByDirector = await Movies.find({ 'Director.Name': directorName });

    if (moviesByDirector.length > 0) {
      res.status(200).json(moviesByDirector);
    } else {
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
