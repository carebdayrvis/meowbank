const redis = require("redis");

const db = require("./db");

const client = redis.createClient();

module.exports = {
	save: function(session, token) {
		return new Promise((resolve, reject) => {
			db.do("update users set plaid_token = $1 where id = $2", [token, session.userId], function(err, res) {
				if (err) return reject(err);
				client.hset("h:banksession:" + session.sessionId, "plaid_token", token, (err) => {
					if (err) return reject(err);
					resolve();
				});
			});
		});
	}
}

