'use strict';
const redis = require("redis");

const client = redis.createClient();
const db = require("./db");

module.exports = function(body) {
    return new Promise((resolve, reject) => {
        if (!body || !body.username || !body.password) return resolve();
		db.do("SELECT * FROM users WHERE username = $1", [body.username], (err, results) => {
            if (err) return reject(err);
            if (!results) return resolve();
			let user = results[0];
            let id = guid();
			client.hmset("h:banksession:" + id, "username", body.username, "userId", user.id, "plaid_token", user.plaid_token, (err) => {
                if (err) return reject(err);
                resolve(id);
			});
		});
	});
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
