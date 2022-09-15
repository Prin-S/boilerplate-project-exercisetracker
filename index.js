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

// User enters username
app.post("/api/users", (req, res, next) => {
  username = req.body.username;
  next();
}, (req, res) => {
  // Find entered username from the database
  User.find({username: username}, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      // If username is not found
      if (data[0] === undefined) {
        // Create new username
        User.create({username: username}, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            // Find username again as it has just been added
            User.find({username: username}, (err, data) => {
              if (err) {
                console.log(err);
              } else {
                // Show username details
                res.json({"username": data[0].username, "_id": data[0]._id});
              }
            });
          }
        });
      } else {
        // If username is found, just show username details
        res.json({"username": data[0].username, "_id": data[0]._id});
      }
    }
  });
});

// User enters exercise details
app.post("/api/users/:_id/exercises", (req, res, next) => {
  id = req.body[":_id"];
  description = req.body.description;
  duration = req.body.duration;
  date = req.body.date;

  if (!date) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  next();
}, (req, res) => {
  User.find({_id: id}, (err, data) => {
    if (err) {
      res.json({"error": "Invalid User ID"});
    } else {
      let username = data[0].username;
      Exercise.create({username: username, description: description, duration: duration, date: date}, (err, data) => {
        if (err) {
          if (description == "" && duration == "") {
            res.json({"error 1": "Description cannot be empty", "error 2": "Duration cannot be empty"});
          } else if (description == "" && !Number(duration)) {
            res.json({"error 1": "Description cannot be empty", "error 2": "Duration must be a number"});
          } else if (description == "") {
            res.json({"error": "Description cannot be empty"});
          } else if (duration == "") {
            res.json({"error": "Duration cannot be empty"});
          } else if (!Number(duration)) {
            res.json({"error": "Duration must be a number"});
          }
        } else {
          Exercise.find({username: username})
                  .sort({_id: "desc"})
                  .limit(1)
                  .exec((err, data) => {
            if (err) {
              console.log(err);
            } else {
              console.log(data);
              res.json({"username": data[0].username, "description": data[0].description, "duration": data[0].duration, "date": data[0].date, "_id": data[0]._id});
            }
          })
        }
      });
      
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});