'use strict';
const plaid = require("plaid");
const redis = require("redis");

const db = require("./db");
const config = require("../plaidconfig")

const rclient = redis.createClient();
const plaidClient = new plaid.Client(config.client, config.secret, plaid.environments.tartan);

module.exports = {
	getWhole: function(session) {
		return new Promise((resolve, reject) => {
			getAllItems(session)
			.then((items) => {
				getAccountInfo(session)
				.then((accounts) => {
					let budget = getBudgetInfo(items, accounts);
					resolve({items: items, accounts: accounts, budget: budget});
				})
				.catch((err) => reject(err))
			})
			.catch((err) => reject(err))
		});
	},
	invalidateCache: function(session) {
		return new Promise((resolve, reject) => {
			rclient.del("k:" + session.userId + ":cache", function(err, res) {
				if (err) return reject(err);
				resolve();
			});
		});
	}
}


function getBudgetInfo(items, accounts) {
	let budgeted = 0;
	let available = 0;
	let map = {};
	let account = (() => accounts.filter((a) => a.subtype == 'checking')[0])();
	available += account.balance.available;
	items.forEach((i) => { if (i.active) { available = (available - i.cost); budgeted += i.cost } map[i.id] = i;});
	items.sort((a, b) => { if (a.due > b.due) return 1; if (a.due < b.due) return -1; if (a.due == b.due) return 0; });
	return {available: Math.floor(available * 100)/100, budgeted: Math.floor(budgeted * 100)/100, map: map};
}



function getAllItems(session) {
	return new Promise((resolve, reject) => {
		db.do("select * from budget_items where user_id = $1", [session.userId], function(err, items) {
			if (err) return reject(err);
			return resolve(items);
		});
	});
}

function getAccountInfo(session) {
	return new Promise((resolve, reject) => {
		rclient.get("k:" + session.userId + ":cache", function(err, res) {
			if (err) console.error(new Error("Error getting cache"));
			if (res) return resolve(JSON.parse(res));
			plaidClient.exchangeToken(session.plaid_token, function(err, res) {
				if (err) return reject(err);
				plaidClient.getBalance(res.access_token, function(err, res) {
					if (err) return reject(err);
					let updated = Date.now();
					res.accounts.forEach((a) => a.updated = updated);
					rclient.set("k:" + session.userId + ":cache", JSON.stringify(res.accounts));
					resolve(res.accounts);
				});
			});
		});
	});
}



