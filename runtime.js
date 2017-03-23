function createScope(parentScope){
	var scope = {};
	
	var scopeFunction = function(identifier, thing){
		// Assignment
		if (thing) {
			// Create a new thing from thing with an identifier.
			// Assign that new thing to the scope.
			return scope[identifier] = new Thing(identifier, thing.items, thing.keys);
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
					thing = new Thing(identifier, [], {});
				}
			}
			
			return thing;
		}
	}
	
	return scopeFunction;
}

var scope = createScope();


function Thing(identifiers, items, keys){
	if (!Array.isArray(identifiers)) {
		identifiers = [identifiers];
	}
	
	var identifier = identifiers[identifiers.length-1];
	
	// thing structure
	this.items = items || [];
	this.keys = keys || {};
	this.identifiers = identifiers;
	this.identifier = identifier;
}

Thing.prototype.is = function(value, scope){
	return scope(this.identifier, value);
}

Thing.prototype.and = function(thing){
	// Creates a new thing from left and right thing.
	// The identifiers of the new thing is an array of the two identifiers
	// The items are concatenated
	// The keys are merged
	var newThing = new Thing([this.identifier, thing.identifier]);
	
	newThing.items = this.items.concat(thing.items);
	newThing.keys = Object.assign(this.keys, thing.keys);
	
	return newThing;
}

Thing.prototype.as = function(thing){
	// Create a new thing with the same identifier
	var newThing = new Thing(this.identifier);
	
	// Set the newThing's key with the same name as the thing's identifier to this thing
	newThing.keys[thing.identifier] = this;
	
	return newThing;
}

Thing.prototype.in = function(thing){
	// Return the thing from the right things keys using the left thing's identifier
	var newThing = thing.keys[this.identifier];
	
	if (!newThing)
		newThing = new Thing(null, []);
	
	return newThing;
}

Thing.prototype.to = function(thing){
	var f = thing.items[0];
	
	if (typeof f === 'function') {
		return f(this);
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
		var valueThing = new Thing(identifier, [value]);
		
		// Define identifier as the valueThing within scope
		scope(identifier, valueThing);
	})
}

function error(message){
	throw new Error("Runtime Error: "+message);
}

// NATIVE FUNCTIONS

scope('log', new Thing(null, [function (inputThing) {
	console.log(inputThing);
}]));

scope('print', new Thing(null, [function (inputThing) {
	console.log(inputThing.items);
}]));