const jwtSecret = 'your_jwt_secret'; // This should be in an environment variable
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('./passport');

function generateJWTToken(user) {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // This is the username you're encoding in the JWT
    expiresIn: '7d', // Token expires in 7 days
    algorithm: 'HS256' // This is the algorithm used to "sign" or encode the values of the JWT
  });
}

// POST login
module.exports = (router) => {
  router.post('/login', (req, res, next) => {
    console.log(req.body, 'login');
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

        const token = generateJWTToken({ Username: user.Username, id: user._id });
        return res.json({ user, token });
      });
    })(req, res);
  });
};