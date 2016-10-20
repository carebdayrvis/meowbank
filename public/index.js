var state = {};
$(document).click(function(e) {
    e = e || event;
    $.lastClicked = $(e.target || e.srcElement);
});


var api = {
	_request: function(options) {
		var url = "/api/";
		if (options.data.id) {
			url += options.data.id;
			delete options.data.id
		}
		$.ajax({
			url: url,
			type: options.type,
			contentType: "application/json",
			data: JSON.stringify(options.data),
			success: options.callback,
			error: options.callback
		});
	},
	create: function(options, callback) {
		this._request({
			data: options, 
			type: "POST",
			callback: callback
		});
	},
	update: function(options, callback) {
		this._request({
			data: options,
			type: "PUT",
			callback: callback
		});
	},
	remove: function(options, callback) {
		this._request({
			data: options,
			type: "DELETE",
			callback: callback
		});
	}
}

function refresh() {
	api._request({
		data: {
			id: "refresh"
		},
		type: "GET",
		callback: function(err, res) {
			console.log(err, res);
		}
	});
}


function expand(el) {
	el = $(el);
	var siblings = el.siblings();
	var list = $(siblings[0].lastChild);
	list.toggle(150);
	el.toggleClass("selected");
}


function toggleAdd() {
	state.adding = !state.adding;
	if (!state.adding) {
		$("#add_item").hide(125);
		$("#submit_item_button").hide(125);
		$("#add_item_button").toggleClass("lnr-plus-circle").toggleClass("lnr-cross-circle");
		return false;
	}
	$("#add_item").show(125);
	$("#submit_item_button").show(125);
	$("#add_item_button").toggleClass("lnr-plus-circle").toggleClass("lnr-cross-circle");
}



function addItem(newItem) {
	var template = '<tr id="' + newItem.id + '">'
	+ '<td>' + newItem.description + '</td><td class="show_arrows_on_hover">'
	+ '<span id="' + newItem.id + '_cost">'
	+ newItem.cost + '</span><span><span onclick="change('
	+ newItem.id + ')" class="arrow lnr lnr-chevron-up"></span><span onclick="change('
	+ newItem.id + ', true)" class="arrow lnr lnr-chevron-down"></span></span></td><td>'
	+ newItem.due + '</td><td class="display_on_hover"><span onclick="active('
  + newItem.id + ')" class="small lnr lnr-checkmark-circle clickable"></span><span onclick="remove('
  + newItem.id + ')" class="small lnr lnr-circle-minus clickable"></span></td></tr>';
	$("#budget_tbody").append(template);
}


function updateBudget(cost) {
	var value = $("#budgeted_amount").text();
	var current = parseFloat($("#current").text());
	cost = parseFloat(cost);
	value = parseFloat(value);
	if (isNaN(value)) {
		value = 0;
	}
	value += cost;
	$("#budgeted_amount").text(value);
	info.budget.budgeted += cost;
	console.log(current, value);
	var newSafe = Math.round((current - value) * 100) / 100;
	$("#safe").text(newSafe);
}
	

function toast(message, level) {
	var map = {
		success: 'hsla(109, 87%, 40%, 1)',
		error: 'hsla(360, 87%, 44%, 1)',
		warn: 'hsla(54, 100%, 60%, 1)'
	}
	var toast = $("#toast");
	toast.text(message);
	toast.css("background-color", map[level]);
	$.lastClicked.appendTo(toast);
	toast.show(125);
}


function submit() {
	var newItem = {
		description: $("input[name=add_description]").val(),
		cost: $("input[name=add_amount]").val(),
		due: $("input[name=add_due]").val(),
	}
	// Remove this
	api.create({
		description: newItem.description,
		cost: newItem.cost, 
		due: newItem.due, 
	}, function(response) {
		// Show some success something here. 
		//toast("Item added!", 'success');
		newItem.id = response;
		addItem(newItem);
		info.budget.map[newItem.id] = newItem;
		console.log(newItem.cost);
		updateBudget(newItem.cost);
		toggleAdd();
	});
}


function active(id) {
	var active = info.budget.map[id].active;
	var newCost = info.budget.map[id].cost;
	api.update({
		id: id,
		action: "status",
		status: !active
	}, function() {
		$("#" + id).toggleClass("inactive_item");
		newCost = !active ? newCost : newCost * -1;
		info.budget.map[id].active = !active;
		updateBudget(newCost);
	});
}


function removeItem(id) {
	console.log(id);
	var cost = info.budget.map[id].cost;
	updateBudget(cost * -1);
	api.remove({
		id: id,
	}, function() {
		// Remove row
		$("#" + id).remove();
	});
}


function change(id, flag) {
	var item = info.budget.map[id];
	var el = $("#" + id + "_cost");
	var ch = flag ? -5 : 5;
	var newCost = item.cost += ch;
	item.cost = newCost;
	el.text(newCost);
	if (item.active) {
		updateBudget(ch);
	}
	api.update({
		id: item.id,
		action: "cost",
		cost: item.cost
	}, function() {
		// Do something
		// As long as it didn't fail?
	});
}
