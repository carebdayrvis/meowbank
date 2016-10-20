const pg = require('pg');
const config = require("../pgconfig")
var exports = {
	do: function(query, args, next) {
		pg.connect(config.conn, function(err, client, done) {
			if (err) {
				done();
				return next(err, null);
			}
			console.log("query", query);
			client.query(query, args, function(err, result) {
				done();
				if (err) {
					return next(err, null);
				}
				if (!result) {
					return next("No results", null);
				}
				return next(null, result.rows);
			});
		});
	},
	end: function() {
		// Brute force way of ending connection. 
		// Should only be used if you are sure that query has finished. 
		pg.end();
	}
}

module.exports = exports;
