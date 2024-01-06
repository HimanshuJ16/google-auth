/*  EXPRESS */
require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const User = require('./models/User');

app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB is Connected!'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }, // THIS WON'T WORK WITHOUT HTTPS
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  })
}));

app.get('/', function(req, res) {
  res.render('pages/home', {user: userProfile});
});

const port = process.env.PORT || 3000;
app.listen(port , () => console.log('App listening on port ' + port));


var passport = require('passport');
var userProfile;
 
app.use(passport.initialize());
app.use(passport.session());
 
app.get('/success', (req, res) => {
  res.render('pages/success', {user: userProfile});
});
app.get('/error', (req, res) => res.send("error logging in"));
 
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


/*  Google AUTH  */
 
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://google-auth-demo-vvap.onrender.com/auth/google/callback"
  },
  async function (accessToken, refreshToken, profile, done) {
    userProfile=profile;
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
            console.log("user is there");
            done(null, user);
        } else {
             const newUser = { 
                googleId: profile.id,
                name: profile.displayName,
                photo: profile.photos[0].value
            };
            user = await User.create(newUser);
            console.log("creating new user");
            done(null, user);
        }
    } catch (err) {
        console.error(err);
    }
  }
));
 
app.get('/auth/google', 
  passport.authenticate('google', { scope : ['profile', 'email'] }));
 
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/');
  });

// app.get('/auth/logout', function(req, res, next){
//   req.logout(function(err) {
//     if (err) { return next(err); }
//     res.redirect('/');
//   });
// });