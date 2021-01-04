//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const awsIot = require("aws-iot-device-sdk")
const socket = require("socket.io");
const http = require("http")
const app = express();
const server = http.createServer(app);
const io = socket(server);

let usernameAuthenticated;

let agentAuth = "";

let thingsShadow;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(session({
	secret: "Ardberry Technology",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/awsIotMultiUser", {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
	email: { type: String, unique: true },
	username: { type: String, unique: true },
	deviceName: { type: String, unique: true },
	privateKey: { type: String, unique: true },
	password: String
});

const agentSchema = new mongoose.Schema({
	email: { type: String, unique: true },
	username: { type: String, unique: true },
	password: String
})

const buttonSchema = new mongoose.Schema({
	username: String,
	buttonType: String,
	buttonId: String,
	buttonSerial: Number,
	maxValue: Number
})

userSchema.plugin(passportLocalMongoose);
agentSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Agent = new mongoose.model("Agent", agentSchema);
const Button = new mongoose.model("Button", buttonSchema);

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

app.get("/secrets/:username", function (req, res) {
	if (req.isAuthenticated() && usernameAuthenticated === req.params.username && usernameAuthenticated !== " ") {
		Button.find({
			username: req.params.username
		}, function (err, data) {
			if (err) {
				console.log(err);
			} else {
				User.findOne({
					username: req.params.username
				}, function (err, userData) {
					if (err) {
						console.log(err);
					} else {
						thingsShadow = awsIot.device({
							keyPath: `data/${userData.privateKey}-private.pem.key`,
							certPath: `data/${userData.privateKey}-certificate.pem.crt`,
							caPath: "data/AmazonRootCA1.pem",
							clientId: `${userData.deviceName}`,
							host: "a1l34b8dami2sc-ats.iot.ap-south-1.amazonaws.com"
						})
					}
				})
				res.render("secrets", {
					buttonsData: data
				})
			}
		})
	} else {
		res.redirect("/login");
	}
});


app.get("/logout", function (req, res) {
	req.logout();
	res.redirect("/");
});

app.post("/register", function (req, res) {
	User.register({
		username: req.body.username,
		email: req.body.email,
		privateKey: req.body.privateKey,
		deviceName: req.body.deviceName
	}, req.body.password, function (err, user) {
		if (err) {
			console.log(err);
			res.redirect("/register");
		} else {
			res.redirect("/login");
		}
	});
});

app.post("/login", function (req, res) {
	const username = req.body.username;
	const password = req.body.password;
	const user = new User({
		username: username,
		password: password
	});
	req.login(user, function (err) {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req, res, function () {
				usernameAuthenticated = username;
				res.redirect(`/secrets/${username}`);
			});
		}
	});
});

app.post("/agentRegister", function (req, res) {
	if (req.body.secretKey === "Ardberry@Technology#123") {
		Agent.register({
			username: req.body.username,
			email: req.body.email
		}, req.body.password, function (err, user) {
			if (err) {
				console.log(err);
				res.redirect("/agentRegister");
			} else {
				res.redirect("/agentLogin")
			}
		});
	}
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
				agentAuth = req.body.username;
				res.redirect(`/agent/${req.body.username}`)
			});
		}
	});
});

app.get("/agent/:username", function (req, res) {
	if (agentAuth === req.params.username) {
		res.render("agentPage")
	}
	else {
		res.send("Unauthorized");
	}
})

app.post("/registerItem", function (req, res) {
	const newButton = new Button({
		username: req.body.username,
		buttonType: req.body.buttonType,
		buttonId: req.body.buttonId,
		buttonSerial: req.body.buttonSerial,
		maxValue: req.body.maxvalue
	})

	newButton.save((err) => {
		if (err) {
			console.log(err);
		}
		else {
			res.redirect(`/agent/${agentAuth}`)
		}
	})
})


function publishToTopicButton(data) {
	thingsShadow.on('connect', function () {
		thingsShadow.subscribe(data.username + 'button');
	})
	thingsShadow.publish(data.username + 'button', JSON.stringify(data));
}

function publishToTopicSlider(data) {
	thingsShadow.on('connect', function () {
		thingsShadow.subscribe(data.username + 'slider');
	})
	thingsShadow.publish(data.username + 'slider', JSON.stringify(data));
}

io.on('connect', socket => {
	socket.on('recieveButtonData', data => {
		if (data.username === usernameAuthenticated) {
			publishToTopicButton(data);
		}
	})

	socket.on('recieveSliderData', data => {
		if (data.username === usernameAuthenticated) {
			publishToTopicSlider(data);
		}
	})
})

server.listen(3000, function () {
	console.log("Server started on port 3000.");
});