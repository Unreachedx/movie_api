const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const Models = require('./models.js');
const { User } = Models;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(new LocalStrategy({
  usernameField: 'Username',
  passwordField: 'Password'
}, async (username, password, callback) => {
  console.log(`Attempting to authenticate user: ${username}`);
  
  try {
    let user = await User.findOne({ Username: username });
    
    if (!user) {
      console.log('Incorrect username');
      return callback(null, false, { message: 'Incorrect username.' });
    }
    
    let isValid = await user.isValidPassword(password);
    if (!isValid) {
      console.log('Incorrect password');
      return callback(null, false, { message: 'Incorrect password.' });
    }

    console.log('User authenticated successfully');
    return callback(null, user);
  } catch (error) {
    console.log('Error during authentication:', error);
    return callback(error);
  }
}));

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
  try {
    const user = await User.findById(jwtPayload.id);
    if (user) {
      return callback(null, user);
    } else {
      return callback(null, false);
    }
  } catch (error) {
    console.error('Error:', error);
    return callback(error);
  }
}));