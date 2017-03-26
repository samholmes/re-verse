function createScope(parentScope){
	var scope = {};
	
	var scopeFunction = function(identifier, thing){
		// Assignment
		if (thing) {
			// Create a new thing from thing argument with it's identifier as the identifier argument.
			var newThing = new Thing(identifier, thing.items, thing.keys);
			
			// Set the definitionScope to the scope in which the new thing is defined
			newThing.signature = thing.signature;
			newThing.body = thing.body;
			newThing.definitionScope = scopeFunction;
			
			// Assign that new thing to the scope.
			return scope[identifier] = newThing;
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

// Definition
Thing.prototype.is = function(value, scope){
	return scope(this.identifier, value);
}

// Composition
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

// Container Storage
Thing.prototype.as = function(thing){
	// Create a new thing with the same identifier
	var newThing = new Thing(this.identifier);
	
	// Set the newThing's key with the same name as the thing's identifier to this thing
	newThing.keys[thing.identifier] = this;
	
	return newThing;
}

// Container Access
Thing.prototype.in = function(thing){
	// Return the thing from the right things keys using the left thing's identifier
	var newThing = thing.keys[this.identifier];
	
	if (!newThing)
		newThing = new Thing(null, []);
	
	return newThing;
}

// Invocation
Thing.prototype.to = function(thing){
	if (typeof thing.body === 'function') {
		inputThing = this;
		
		// Create a new scope for the invocation.
		// This new scope will have the function's definition scope as the parent scope.
		var functionScope = createScope(thing.definitionScope);
		
		// Signature handling
		if (typeof thing.signature === 'function') {
			// Get the parameter thing
			var parameterThing = thing.signature(thing.definitionScope);
			
			if (parameterThing) {
				// Destructure Parameters into function's scope
				destructure(parameterThing, inputThing, functionScope);
			}
		}
		
		// Define an input thing as the inputThing
		functionScope('input', inputThing);
		
		// Invoke body with the new scope
		return thing.body(functionScope); 
				
		return f(this);
	}
	else {
		error(thing.identifier + " is not a function.");
	}
}

Thing.prototype.lambda = function(signature, body){
	this.signature = signature;
	this.body = body;
	
	return this;
}

// Destructuring (Defining the identifiers of a thing as the values of an inputThing within a specific scope)
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