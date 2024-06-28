const passport = require('passport');
const jwt = require('jsonwebtoken');
const passportJWT = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const Models = require('./models.js');

const jwtSecret = 'your_jwt_secret';
const Users = Models.User;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

module.exports = (app) => {
  app.use(passport.initialize());

  passport.use(new LocalStrategy({
    usernameField: 'Username',
    passwordField: 'Password'
  }, async (username, password, callback) => {
    console.log(`Attempting login for username: ${username}`);
    try {
      const user = await Users.findOne({ Username: username });
  
      if (!user) {
        console.log('User not found for username:', username);
        return callback(null, false, { message: 'Incorrect username.' });
      }
  
      const passwordIsValid = await bcrypt.compare(password, user.Password);
      console.log(`Password validation result for username ${username}: ${passwordIsValid}`);
  
      if (!passwordIsValid) {
        console.log('Incorrect password for username:', username);
        return callback(null, false, { message: 'Incorrect password.' });
      }
  
      console.log(`User authenticated successfully for username: ${username}`);
      return callback(null, user);
    } catch (error) {
      console.log('Error occurred while finding user:', error);
      return callback(error);
    }
  }));

  passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret
  }, async (jwtPayload, callback) => {
    try {
      const user = await Users.findById(jwtPayload._id);
      if (!user) {
        return callback(null, false, { message: 'User not found.' });
      }
      return callback(null, user);
    } catch (error) {
      console.error('Error occurred in JWT strategy:', error);
      return callback(error);
    }
  }));

  app.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        console.log('Authentication failed:', error || info);
        return res.status(400).json({
          message: 'Invalid credentials',
          error: error ? error.message : info.message
        });
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          console.error('Login error:', error);
          return res.status(500).send(error);
        }

        const token = jwt.sign({ _id: user._id }, jwtSecret, {
          expiresIn: '7d'
        });

        return res.json({ user, token });
      });
    })(req, res);
  });
};