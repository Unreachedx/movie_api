const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
const passportJWT = require('passport-jwt');

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

module.exports = (app) => {
  const jwt = require('jsonwebtoken');

  app.use(passport.initialize());

  passport.use(new LocalStrategy({
    usernameField: 'Username',
    passwordField: 'Password'
  }, (username, password, callback) => {
    console.log(`${username} ${password}`);
    Users.findOne({ Username: username }, (error, user) => {
      if (error) {
        console.log(error);
        return callback(error);
      }

      if (!user) {
        console.log('incorrect username');
        return callback(null, false, { message: 'Incorrect username.' });
      }

      if (!user.isValidPassword(password)) {
        console.log('incorrect password');
        return callback(null, false, { message: 'Incorrect password.' });
      }

      console.log('finished');
      return callback(null, user);
    });
  }));

  passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
  }, (jwtPayload, callback) => {
    return Users.findById(jwtPayload._id)
      .then((user) => {
        return callback(null, user);
      })
      .catch((error) => {
        return callback(error);
      });
  }));

  app.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        console.log('Authentication failed:', error, info);
        return res.status(400).json({
          message: 'Something is not right',
          user: user
        });
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }

        const token = jwt.sign(user.toJSON(), 'your_jwt_secret', {
          subject: user.Username,
          expiresIn: '7d',
          algorithm: 'HS256'
        });

        return res.json({ user, token });
      });
    })(req, res);
  });
};
