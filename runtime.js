function createScope(parentScope){
	var scope = {};
	
	var scopeFunction = function(identifier, thing){
		// Assignment
		if (thing) {
			// Create a new thing from thing with an identifier.
			// Assign that new thing to the scope.
			return scope[identifier] = THING(identifier, thing.items, thing.keys);
		}
		// Retrieval
		else {
			var thing;
			thing = scope[identifier];
			
			// If thing is undefined
			if (!thing) {
				// Look for it in parent scope
				if (typeof parentScope === 'function') {
					thing = parentScope(identifier);
				}
				// If not found in parent, then create an undefined thing
				else {
					thing = THING(identifier, [], {});
				}
			}
			
			return thing;
		}
	}
	
	return scopeFunction;
}

var scope = createScope();

function define(thing, value, withinScope){
	return withinScope(thing.identifier, value);
}

function THING(identifiers, items, keys){
	if (!Array.isArray(identifiers)) {
		identifiers = [identifiers];
	}
	
	var identifier = identifiers[identifiers.length-1];
	
	// thing structure
	var thing = {
		items: items || [],
		keys: keys || {},
		identifiers: identifiers,
		identifier: identifier
	};
	
	return thing;
}

function and(leftThing, rightThing){
	// Creates a new thing from left and right thing.
	// The identifiers of the new thing is an array of the two identifiers
	// The items are concatenated
	// The keys are merged
	return THING([leftThing.identifier, rightThing.identifier], leftThing.items.concat(rightThing.items), Object.assign(leftThing.keys, rightThing.keys));
}

function as(leftThing, rightThing){
	// Create a new thing where the key is the identifier of the right thing
	// And the value is the left thing
	var keys = {};
	keys[rightThing.identifier] = leftThing;
	return THING(leftThing.identifier, [], keys);
}

function inside(leftThing, rightThing){
	// Return the thing from the right things keys using the left thing's identifier
	var thing = rightThing.keys[leftThing.identifier];
	
	if (!thing)
		thing = THING(null, []);
	
	return thing;
}

function invoke(thing, inputThing){
	var f = thing.items[0];
	
	if (typeof f === 'function') {
		return f(inputThing);
	}
	else {
		error(thing.identifier + " is not a function.");
	}
}

function destructure(thing, inputThing, scope){
	thing.identifiers.forEach(function(identifier, index){
		// Value will be...
		// the input thing's key that is same as the identifier
		if (inputThing.keys[identifier]) {
			var value = inputThing.keys[identifier];
		}
		// or the input thing's value
		else if (inputThing.items[index]) {
			var value = inputThing.items[index];
		}
		// the thing's key that is same as the identifier
		else if (thing.keys[identifier]) {
			var value = thing.keys[identifier];
		}
		// or the thing's value
		else if (identifier === thing.identifier) {
			var value = thing.items[0];
		}
		
		// Create new thing from value
		var valueThing = THING(identifier, [value]);
		
		// Define identifier as the valueThing within scope
		scope(identifier, valueThing);
	})
}

function error(message){
	throw new Error("Runtime Error: "+message);
}

// NATIVE FUNCTIONS

scope('log', THING(null, [function (inputThing) {
	console.log(inputThing);
}]));

scope('print', THING(null, [function (inputThing) {
	console.log(inputThing.items);
}]));