const jwtSecret = process.env.JWT_SECRET;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const Models = require('./models.js');

const Users = Models.User;

// Configure Local Strategy for Passport
passport.use(new LocalStrategy(
  {
    usernameField: 'Username',
    passwordField: 'Password'
  },
  (username, password, callback) => {
    Users.findOne({ Username: username })
      .then((user) => {
        if (!user) {
          return callback(null, false, { message: 'Incorrect username or password.' });
        }

        if (!user.isValidPassword(password)) {
          return callback(null, false, { message: 'Incorrect username or password.' });
        }

        return callback(null, user);
      })
      .catch((err) => callback(err));
  }
));

// Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign({ username: user.Username, id: user._id }, jwtSecret, { expiresIn: '7d' });
};

module.exports = function (app) {
  // Handle POST request to /login
  app.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }

        const token = generateToken(user);

        return res.json({ user, token });
      });
    })(req, res, next);
  });
};