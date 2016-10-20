'use strict';
const express = require("express");

const db = require("./db");

const router = express.Router();
module.exports = router;

router.put("/:id", (req, res, next) => {
	let action = req.body.action;
	switch (action) {
		case "status": 
			db.do("update budget_items set active = $1 where id = $2", [req.body.status, req.params.id], function(err, result) {
				if (err) next(err);
				res.send();
			});
			break;
		case "cost": 
			db.do("update budget_items set cost = $1 where id = $2", [req.body.cost, req.params.id], function(err, result) {
				if (err) next(err);
				res.send();
			});
			break;
	}
});

router.post("/", (req, res, next) => {
	let id = Math.floor(Math.random()*99999) + 100000; 
	db.do("insert into budget_items values ($1, $2, $3, $4, $5, $6)", [id, req.body.description, req.body.cost, true, res.locals.session.userId, req.body.due], function(err, result) {
		if (err) next(err);
		res.json(id);
	});
});

router.delete("/:id", (req, res, next) => {
	db.do("delete from budget_items where id = $1", [req.params.id], function(err, result) {
		if (err) next(err);
		res.send();
	});
});
