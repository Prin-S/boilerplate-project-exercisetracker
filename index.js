const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const port = process.env.PORT || 3000;

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [{
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    date: String
  }]
});

let User = mongoose.model("User", userSchema);

// For clearing the database
/*User.remove((err) => {
  console.log( "User database cleared" );
});*/

// Show all existing users when visiting '/api/users'
app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.json(data);
    }
  })
});

// Add username
app.post("/api/users", (req, res, next) => {
  username = req.body.username;
  next();
}, (req, res) => {
  // Check if username exists
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
                res.json({username: data[0].username, _id: data[0]._id});
              }
            });
          }
        });
      } else {
        // If username is found, just show username details
        res.json({username: data[0].username, _id: data[0]._id});
      }
    }
  });
});

// Add exercise
app.post("/api/users/:_id/exercises", (req, res, next) => {
  id = req.params._id;
  description = req.body.description;
  duration = req.body.duration;
  date = req.body.date;

  // Change 'date' to date object, then to string
  if (!date) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  next();
}, (req, res) => {
  // Check if id exists
  User.find({_id: id}, (err, data) => {
    if (err) {
      res.json({error: "Invalid User ID"});
    } else {
      (data.length == 0) ? res.json({error: "Invalid User ID"})
      : (description == "" && duration == "") ? res.json({"error 1": "Description cannot be empty", "error 2": "Duration cannot be empty"})
      : (description == "" && !Number(duration)) ? res.json({"error 1": "Description cannot be empty", "error 2": "Duration must be a number"})
      : (description == "") ? res.json({error: "Description cannot be empty"})
      : (duration == "") ? res.json({error: "Duration cannot be empty"})
      : (!Number(duration)) ? res.json({error: "Duration must be a number"})
      // If id exists, update user with new exercise
      : User.findByIdAndUpdate(id, {$push: {log: {description: description, duration: duration, date: date}}}, {new: true}, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            // Show added exercise details
            User.find({_id: id}, (err, data) => {
              if (err) {
                console.log(err);
              } else {
                exerciseList = data[0].log;
                lastestExercise = exerciseList[exerciseList.length - 1]; // Find the newest exercise entry details
                
                res.json({username: data[0].username, description: lastestExercise.description, duration: lastestExercise.duration, date: lastestExercise.date, _id: data[0]._id});
              }
            })
          }
        });
    }
  });
});

// Show user exercise log according to id
app.get("/api/users/:_id/logs", (req, res, next) => {
  id = req.params._id;
  from = req.query.from;
  to = req.query.to;
  limit = req.query.limit;
  next();
}, (req, res) => {
  // Find all exercise details of input id
  User.find({_id: id}, (err, data) => {
    if (err) {
      res.json({error: "Invalid User ID"});
    } else {
      if (data.length == 0) {
        res.json({error: "Invalid User ID"});
      } else {
        // Map each exercise entry into an array of objects
        log = data[0].log.map(each => {
          return {
            description: each.description,
            duration: each.duration,
            date: each.date
          }
        })
        
        // If 'from' query is used, select entries with dates from 'from' onwards
        if (from) {
          fromDate = new Date(from).toDateString();
          log = log.filter(each => Date.parse(each.date) >= Date.parse(fromDate));
        }

        // If 'to' query is used, select entries with dates up to 'to'
        if (to) {
          toDate = new Date(to).toDateString();
          log = log.filter(each => Date.parse(each.date) <= Date.parse(toDate));
        }
        
        // If 'limit' query is used, limit the number of entries shown to 'limit'
        if (limit) {
          log = log.slice(0, limit);
        }
        
        // Show username, count (number of exercise entries) and exercise log
        res.json({username: data[0].username, count: data[0].log.length, _id: id, log});
      }
    }
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});