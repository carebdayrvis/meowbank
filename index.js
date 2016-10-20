const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const moment = require("moment");
const _ = require("underscore");

const authenticate = require("./lib/authenticate");
const restRouter = require("./lib/rest-router");
const validateLogin = require("./lib/validate-login");
const plaidToken = require("./lib/plaid-token");
const budgetData = require("./lib/budgetData");

const app = express();

app.set("view engine", "pug");
app.set("views", "./views");

app.use(express.static("./public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).send();
});

app.use("/api", authenticate, restRouter);

app.post("/authenticate", authenticate, (req, res, next) => {
	plaidToken.save(res.locals.session, req.body.public_token)
	.then(() => res.redirect("/"))
	.catch((err) => {
		console.error(err);
		res.status(500).send();
	});
});

app.get("/", authenticate, (req, res, next) => {
	if (!res.locals.session.plaid_token) {
		return res.render("index");
	}
	budgetData.getWhole(res.locals.session)
	.then((info) => {
		info.accounts.forEach((a) => a.updated = moment(a.updated).format("M/D/YY HH:mm:ss"));
		res.render("index", {session: res.locals.session, info: info});
	})
	.catch((err) => next(err));
});

app.post("/login", (req, res, next) => {
    validateLogin(req.body)
    .then((session) => {
        if (!session) return res.render("login", {message: "Incorrect username or password"});
        res.cookie("banksession", session);
        res.redirect("/")
    })
    .catch((err) => next(err));
});

app.get("/refresh", authenticate, (req, res, next) => {
	budgetData.invalidateCache(res.locals.session)
	.then(() => res.redirect("/"))
	.catch((err) => next(err));
});


app.listen(4400);
