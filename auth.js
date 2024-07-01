const passport = require('passport');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { check, validationResult } = require('express-validator');

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiry = '7d';

const generateJWTToken = (user) => {
  return jwt.sign({ id: user._id, username: user.Username }, jwtSecret, { expiresIn: jwtExpiry });
};

module.exports = (app) => {
  app.post('/login', [
    check('Username', 'Username is required').not().isEmpty(),
    check('Password', 'Password is required').not().isEmpty(),
  ], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(400).json({ message: 'Something is not right', user });
      }

      req.login(user, { session: false }, (err) => {
        if (err) {
          res.send(err);
        }
        const token = generateJWTToken(user);
        return res.json({ user, token });
      });
    })(req, res, next);
  });
};
