//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/user1DB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String
});

const agentSchema = new mongoose.Schema({
  email: String,
  password: String
})

userSchema.plugin(passportLocalMongoose);
agentSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Agent = new mongoose.model("Agent", agentSchema);

passport.use('userLocal', User.createStrategy());
passport.use('agentLocal', Agent.createStrategy());

passport.serializeUser(User.serializeUser());
passport.serializeUser(Agent.serializeUser());

passport.deserializeUser(User.deserializeUser());
passport.deserializeUser(Agent.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/agentLogin", function (req, res) {
  res.render("agentLogin");
});

app.get("/agentRegister", function (req, res) {
  res.render("agentRegister");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});


app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("userLocal")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/agentRegister", function (req, res) {
  Agent.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("agentLocal")(req, res, function () {
        res.send("Agent Login");
      });
    }
  });
});

app.post("/agentLogin", function (req, res) {
  const agent = new Agent({
    username: req.body.username,
    password: req.body.password
  });
  req.login(agent, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("agentLocal")(req, res, function () {
        res.send("AGent Login")
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
