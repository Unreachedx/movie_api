const jwtSecret = 'your_jwt_secret'; // Replace with your actual JWT secret
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
const passportJWT = require('passport-jwt');

const Users = Models.User;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(new LocalStrategy(
  {
    usernameField: 'Username',
    passwordField: 'Password'
  },
  (username, password, callback) => {
    console.log(username + ' ' + password);
    Users.findOne({ Username: username })
      .then((user) => {
        if (!user) {
          return callback(null, false, { message: 'Incorrect username or password.' });
        }

        user.validatePassword(password, (err, isMatch) => {
          if (err) { return callback(err); }
          if (!isMatch) {
            return callback(null, false, { message: 'Incorrect username or password.' });
          }
          return callback(null, user);
        });
      })
      .catch((err) => { return callback(err); });
  }
));

passport.use(new JWTStrategy(
  {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret
  },
  async (jwtPayload, callback) => {
    try {
      const user = await Users.findById(jwtPayload._id);
      if (!user) {
        return callback(null, false, { message: 'User not found' });
      }
      return callback(null, user);
    } catch (error) {
      return callback(error);
    }
  }
));

module.exports = function (app) {
  app.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: 'Something is not right',
          user: user
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        const token = jwt.sign(user.toJSON(), jwtSecret, { expiresIn: '1h' });
        return res.json({ user, token });
      });
    })(req, res);
  });
};
