const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
const passportJWT = require('passport-jwt');

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

passport.use(new LocalStrategy({
  usernameField: 'Username',
  passwordField: 'Password'
}, async (username, password, callback) => {
  console.log(`Attempting to authenticate user: ${username}`);
  
  try {
    let user = await Users.findOne({ Username: username });
    
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
const jwtSecret = 'your_jwt_secret';

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret
}, async (jwtPayload, callback) => {
  try {
    let user = await Users.findById(jwtPayload.id);
    if (user) { return callback(null, user); } 
    else { return callback(null, false); } } 
    catch (error) { return callback(error); } }));






