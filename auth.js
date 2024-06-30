const jwtSecret = 'your_jwt_secret'; // Replace with your actual JWT secret
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
/* const passportJWT = require('passport-jwt'); */

const Users = Models.User;
/* const JWTStrategy = passportJWT.Strategy; */
/* const ExtractJWT = passportJWT.ExtractJwt; */

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

// Allows to authenticate users based on the JWT submitted alongside their request.
var JwtStrategy = require('passport-jwt').Strategy,
ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = jwtSecret;
passport.use(new JwtStrategy(opts, async function (jwt_payload, done) {
try {
  console.log(jwt_payload, 'jwt_payload')
  const user = await Users.findById(jwt_payload.id)
  if (user) {
    return done(null, user)
  } else {
    return done(null, false)
  }
} catch (error) {
  done(error)
}
}));

module.exports = function (app) {
  app.post('/login', (req, res, next) => {
    console.log(req.body, 'login');
    next()
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

        const token = jwt.sign({ username: user.Username, id: user.id }, jwtSecret, {
          expiresIn: '7d'
        });

        return res.json({ user, token });
      });
    })(req, res);
  });
};
