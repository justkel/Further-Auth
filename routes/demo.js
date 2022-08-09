const express = require('express');
const bcrypt = require('bcryptjs')

const db = require('../data/database');

const router = express.Router();

router.get('/', function (req, res) {
  res.render('welcome');
});

router.get('/signup', function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: '',
      confirmEmail: '',
      password: ''
    };
  }

  req.session.inputData = null;  //to delete the above session data after being used
  
  res.render('signup', { inputData : sessionInputData});
});

router.get('/login', function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: '',
      password: ''
    };
  }

  req.session.inputData = null;
  res.render('login', { inputData : sessionInputData});
});

router.post('/signup', async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredConfirmEmail = userData['confirm-email'];  // [] because of the presence of a forbidden character
  const enteredPassword = userData.password;

  if (
    !enteredEmail || 
    !enteredConfirmEmail ||
    !enteredPassword ||
    enteredPassword.trim() < 6 ||
    enteredEmail !== enteredConfirmEmail ||
    !enteredEmail.includes('@')

  ) {
    req.session.inputData = {
      hasError: true,
      message: 'Invalid input- please check your Data.',
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword
    };

    req.session.save(function() {  // save the session before it gets redirected
      res.redirect('/signup')
    });
    return;  // to prevent crashing, i.e Cannot set headers after they are sent to the client
  }
  
  const existingUser = await db
  .getDb().collection('users').findOne({email: enteredEmail}) 

  if(existingUser) {
    req.session.inputData = {  // when user already exists
      hasError: true,
      message: 'User exists already.',
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword
    };

    req.session.save(function (){
      res.redirect('/signup')
    })
    return;
  }

  const hashedPassword = await bcrypt.hash(enteredPassword, 12);

  const user = {
    email: enteredEmail,
    password: hashedPassword
  };

  await db.getDb().collection('users').insertOne(user);

  res.redirect("/login")

});
  
router.post('/login', async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredPassword = userData.password;

  const existingUser = await db 
  .getDb().collection('users').findOne({email: enteredEmail})

  if(!existingUser) {
    req.session.inputData = {  // when user could not log in
      hasError: true,
      message: 'Could not log you in- Please check your credentials.',
      email: enteredEmail,
      password: enteredPassword
    };

    req.session.save( function() {
      res.redirect('/login')
    })
    return;
  }

  const passwordsAreEqual = await bcrypt.compare(
    enteredPassword, existingUser.password
  )
  
  if(!passwordsAreEqual){
    req.session.inputData = {  // when user could not log in
      hasError: true,
      message: 'Could not log you in- Please check your credentials.',
      email: enteredEmail,
      password: enteredPassword
    };
    req.session.save( function() {
      res.redirect('/login')
    })
    return;
  }

  req.session.user = {id: existingUser._id, email: existingUser.email };  // This session property/object is provided by the express-session package to manage the sessions for us. Every Request, no matter if a logged-in-user or not, -has a session
  req.session.isAuthenticated = true;
  req.session.save(function() {
    res.redirect('/profile') // only executes once the session has being saved to the DB, preventing it from a premature redirection
  })

});

// router.get('/admin',async function (req, res) {
//   if (!req.session.isAuthenticated) {  // if (!req.session.user)
//     return res.status(401).render('401')
//   }

//   const user = await db.getDb().collection('users').findOne({_id: req.session.user.id})  // id from line 109, req.session.user
  
//   if(!user || !user.isAdmin) {
//     return res.status(403).render('403')
//   }
//   res.render('admin');
// });

router.get('/admin',async function (req, res) {
  if (!res.locals.isAuth) {  // if (!req.session.user)
    return res.status(401).render('401')
  }

  // const user = await db.getDb().collection('users').findOne({_id: req.session.user.id})  // id from line 109, req.session.user
  
  if(!res.locals.isAdmin) {
    return res.status(403).render('403')
  }
  res.render('admin');
});

router.get('/profile', function (req, res) {
  if (!res.locals.isAuth) {  // if (!req.session.user) OT (!req.session.isAuthenticated)
    return res.status(401).render('401')
  }
  
  res.render('profile');
});

router.post('/logout', function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect('/');
});

module.exports = router;


// db.sessions.find()
// db.users.updateOne({_id: ObjectId("62ea7fe76069e8c067526e92")}, {$set: { isAdmin: true }})

// Session.save(callback)
// Save the session back to the store, replacing the contents on the store with the contents in memory (though a store may do something else–consult the store’s documentation for exact behavior).
// This method is automatically called at the end of the HTTP response if the session data has been altered (though this behavior can be altered with various options in the middleware constructor). Because of this, typically this method does not need to be called.