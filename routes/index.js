var express = require('express');
var router = express.Router();
const bcryptjs = require('bcryptjs');
var User = require('../models/User.model');
const Room = require('../models/Room.model');
const isLoggedIn = require('../middleware/isLoggedIn')
const isOwner = require('../middleware/isOwner')
const Review = require('../models/Review.model')
const isNotOwner = require('../middleware/isNotOwner')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/signup', (req, res, next) => {
  res.render('signup.hbs')
})

router.post('/signup', (req, res, next) => {
  console.log(req.body)

  if(!req.body.email || !req.body.password) {
      res.send('sorry you forgot an email or password')
      return;
  }

  User.findOne({ email: req.body.email })
  .then(foundUser => {
      if(foundUser) {
          res.send('sorry user already exists')
          return;
      }

      return User.create({
          email: req.body.email,
          password: bcryptjs.hashSync(req.body.password),
          fullName: req.body.fullName
      })
  })

  .then(createdUser => {
      console.log("here's the new user", createdUser)
      res.redirect('/')
  })
  .catch(err => {
      console.log(err)
      res.send(err)
  })
})

router.get('/login', (req, res, next) => {
  res.render('login.hbs')
})



router.post('/login', (req, res, next) => {

  const { email, password } = req.body

  if(!email || !password) {
      res.render('login.hbs', { errorMessage: 'sorry you forgot email or password'})
      return;
  }

  User.findOne({ email: email })
      .then(foundUser => {

          if(!foundUser) {
              // res.send('sorry user does not exist')
              res.render('login.hbs', { errorMessage: 'sorry user does not exist' })
              return;
          }

          const isValidPassword = bcryptjs.compareSync(password, foundUser.password)

          if(!isValidPassword) {
              // res.send('sorry wrong password')
              res.render('login.hbs', { errorMessage: 'sorry wrong password' })
              return;
          }

          req.session.user = foundUser
          // res.send('logged in')
          res.render('index.hbs', foundUser)
      })
      .catch(err => {
          console.log(err)
          res.send(err)
      })
})

router.get('/logout', (req, res, next) => {
  req.session.destroy(() => {
      res.redirect('/');
  })
})


router.get("/room/create", (req, res, next) => {
  res.render('create-room')
});

router.post('/room/create', isLoggedIn, (req, res, next) => {
  console.log(req.body)
  Room.create({
      name: req.body.name,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      owner: req.session.user
  })
      .then(createdRoom => {
          console.log('i created a room', createdRoom);
          res.redirect('/')
      })
      .catch(err => {
          res.send(err)
  })
})


router.get('/list-rooms', (req, res, next) => {
  Room.find()
  .populate({
    path: "reviews",
    populate: {
      path: "user",
    },
  })
  .then((foundRooms) => {
    res.render('list-rooms.hbs', {foundRooms})
  })
  .catch((err) => {
    console.log(err)
  })
})

router.post('/rooms/:id/delete', isOwner, (req, res, next) => {
  Room.findById(req.params.id)
    .then((foundRoom) => {
        foundRoom.delete()
        res.redirect('/')
    })
    .catch((err) => {
      console.log(err)
    })
})

router.get('/rooms/:id/edit-room', isOwner, (req, res, next) => {
  Room.findById(req.params.id)
    .then((foundRoom) => {
      res.render('edit-room', foundRoom)
    })
    .catch((err) => {
      console.log(err)
    })
})

router.post('/rooms/:id/edit-room', isOwner, (req, res, next) => {
  Room.findByIdAndUpdate(req.params.id, {
    name: req.body.name,
    description: req.body.description,
    imageUrl: req.body.imageUrl
  }, {new: true})
  .then((updatedRoom) => {
    console.log("changed room:", updatedRoom)
    res.redirect('/')
  })
  .catch((err) => {
    console.log(err)
  })
})

router.get('/:id/add-reviews', isNotOwner, (req, res, next) => {
  res.render('add-review', {_id: req.params.id})
})

router.post('/add-reviews', isNotOwner, (req, res, next) => {
  Review.create({
    user: req.session.user._id,
    comment: req.body.comment
  })
  .then((newReview) => {
    Room.findByIdAndUpdate(
      req.params.id, 
      { $addToSet: { reviews: newReview._id } }
      , {new: true}
      )
      .then((updatedRoom) => {
        console.log('new review', updatedRoom)
        res.redirect('/')
      })
      .catch((err) => {
        console.log(err)
      })
  })
  .catch((err) => {
    console.log(err)
  })
})


module.exports = router;
