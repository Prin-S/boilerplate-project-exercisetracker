const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const port = process.env.PORT || 3000;

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const e = require('express');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({extended: false}));

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

let exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: String
});

let User = mongoose.model("User", userSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema);

// For clearing databases
/*User.remove((err) => {
  console.log( "User database cleared" );
});*/
/*Exercise.remove((err) => {
  console.log( "Exercise database cleared" );
});*/

// Show all existing users when visiting /api/users
app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.json(data);
    }
  })
});




// Add new username
app.post("/api/users", (req, res, next) => {
  username = req.body.username;
  next();
}, (req, res, next) => {
  // Find all entries from the database
  User.find({username: username}, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (data[0] === undefined) {
        User.create({username: username}, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            User.find({username: username}, (err, data) => {
              if (err) {
                console.log(err);
              } else {
                res.json({"username": data[0].username, "_id": data[0]._id});
              }
            });
            
          }
        });
      } else {
        res.json({"username": data[0].username, "_id": data[0]._id});
      }
    }
  });
  next();
}, (req, res) => {

  console.log("ready");

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});