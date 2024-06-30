const jwtSecret = process.env.JWT_SECRET; // Use environment variable for JWT secret
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
const jwt = require('jsonwebtoken');

const Users = Models.User;

passport.use(new LocalStrategy(
  {
    usernameField: 'Username',
    passwordField: 'Password'
  },
  (username, password, callback) => {
    console.log(`Attempting to authenticate user: ${username}`);
    Users.findOne({ Username: username })
      .then((user) => {
        if (!user) {
          console.log('User not found');
          return callback(null, false, { message: 'Incorrect username or password.' });
        }

        if (!user.isValidPassword(password)) {
          console.log('Password does not match');
          return callback(null, false, { message: 'Incorrect username or password.' });
        }

        console.log('Authentication successful');
        return callback(null, user);
      })
      .catch((err) => {
        console.log('Error finding user:', err);
        return callback(err);
      });
  }
));

const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
let opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = jwtSecret;

passport.use(new JwtStrategy(opts, async function (jwt_payload, done) {
  try {
    console.log('JWT payload:', jwt_payload);
    const user = await Users.findById(jwt_payload.id);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    done(error);
  }
}));

module.exports = function (app) {
  app.post('/login', (req, res, next) => {
    console.log('Login request body:', req.body);
    next();
  }, (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        console.log('Authentication failed:', error || info);
        return res.status(400).json({
          message: 'Invalid credentials'
        });
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }

        const token = jwt.sign({ username: user.Username, id: user._id }, jwtSecret, {
          expiresIn: '7d'
        });

        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Origin', 'http://localhost:1234');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

        return res.json({ user, token });
      });
    })(req, res);
  });
};