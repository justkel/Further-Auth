const path = require('path');

const express = require('express');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')

const db = require('./data/database');
const demoRoutes = require('./routes/demo');
const { userInfo } = require('os');

const MongoDBStore = mongodbStore(session);

const app = express();

const sessionStore = new MongoDBStore ({
  uri: 'mongodb://localhost:27017',
  databaseName: 'auth-demo',
  collection: 'sessions' // collection in which our session entry is stored
})

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'my-super-secret',
  resave: false, // false- only updated in the DB if the data in it changed. While for true- a new session is stored in the DB even if nothing about the data changed
  saveUninitialized: false,  //false- a session is really only stored in the DB when we have a data in it
  store: sessionStore
}))


//The order of these middleware functions matters! 
app.use( async function(req, res, next) {
  const user = req.session.user
  const isAuth = req.session.isAuthenticated;
//locals allows you to set some global values, any values of your choice that would be available all through the req n res cycle


  if (!user || !isAuth) {
    return next();  // The request for which this middleware is executed, should be forwarded to the next middleware or route in line. i.e demoRoutes 
  }

  const userDoc = await db.getDb().collection('users').findOne({_id: user.id})
  const isAdmin = userDoc.isAdmin;

  res.locals.isAuth = isAuth
  res.locals.isAdmin = isAdmin

  next();
})

app.use(demoRoutes);

app.use(function(error, req, res, next) {
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});
