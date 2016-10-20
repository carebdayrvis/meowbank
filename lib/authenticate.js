const redis = require("redis");

const db = require("./db");

const client = redis.createClient();

module.exports = function(req, res, next) {
    if (req.cookies.banksession) {
        getSession(req.cookies.banksession)
        .then((session) => {
			res.locals.session = session;
			next();
		})
        .catch((err, authed) => {
            if (err) return next(err);
            if (!authed) return res.render("login");
        });
    } else {
        return res.render("login");
    }
}

function getSession(id) {
    return new Promise((resolve, reject) => {
        client.hgetall("h:banksession:" + id, (err, session) => {
            if (err) return reject(err);
            if (!session) return reject(null, false);
			if (session.plaid_token == "null") session.plaid_token = null;
			session.sessionId = id;
            resolve(session);
        });
    });
}
