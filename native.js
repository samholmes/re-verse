(function(scope){
	// Creates a lambda thing thing
	function createLambdaThing(signature, body){
		return (new Thing(null)).lambda(signature, body);
	}
	
	// Creates a lambda thing from a JS function
	function convertToLambdaThing(f) {
		var functionSignatureString = (f.toString().match(/\((.+?)\)/) || [])[1];
		var parameters = functionSignatureString
			? functionSignatureString.split(/\s*,\s*/)
			: [];
		
		var signature = creaetSignature(parameters);
		
		var body = function(scope){
			var args = [];
			
			parameters.forEach(function(parameter){
				args.push(scope(parameter).items[0]);
			})
			
			return f.apply(this, args);
		}
		
		return createLambdaThing(signature, body);
	}
	
	// Creates a signature function from an array of identifier names
	function creaetSignature(parameters){
		return function(scope){
			return parameters.reduce(function(inputThing, parameter){
				if (!inputThing) {
					inputThing = new Thing(parameter);
				}
				else {
					inputThing = inputThing.and(scope(parameter));
				}
				return inputThing;
			}, null);
		};
	}
	
	scope('log', createLambdaThing(null, function(scope){
		console.log(scope('input'));
	}));

	scope('print', convertToLambdaThing(function(x){
		console.log(x);
	}));
})(scope);
