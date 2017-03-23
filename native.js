scope('log', lambda(function (inputThing) {
	console.log(inputThing);
}));

scope('print', lambda(function (inputThing) {
	console.log(inputThing.items);
}));