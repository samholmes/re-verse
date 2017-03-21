module.exports = function tokenizer(symbols){
	var tokens = [];
	
	// Run multiple passes for each definitions in definitionsList
	definitionsList.forEach(function(definitions){
		tokens = atomizer((tokens.length ? tokens : symbols), definitions);
	})
	
	
	// Remove BOF and EOF; they are only needed for tokenization
	tokens = tokens.slice(1, -1);
	
	// console.log("TOKENSSSSSS")
	// console.log(JSON.stringify(tokens, null, 2));
	
	return tokens;
}


/**
 * Creates a new set of tokens form a set of tokens known as atoms using a set of definitions.
 * @param  {[type]} atoms  [description]
 * @param  {[type]} types  [description]
 * @return {[type]} tokens [description]
 */

function atomizer(atoms, types){
	var tokens = [];
	
	for (var index = 0; index < atoms.length; index++) {
		var atom = atoms[index],
			token = returnToken || {},
			returnToken;
		
		var found = types.some(function(type){
			returnToken = type.definition(token, atom, index, atoms);
			
			// Exit loop if found
			if (returnToken) return true;
		});
		
		// If token is new
		if (found && returnToken !== token) {
			tokens.push(returnToken);
		}
	}
	
	// Always add special BOF and EOF tokens
	tokens.unshift({type: 'BOF', val: null});
	tokens.push({type: 'EOF', val: null});
	// These tokens help guarantee that look backs and look aheads wont error cause errors.
	// Also EOF will help with statement-terminator definitions.
	
	return tokens;
}

function useRegexAsDefinition(token, atom, index, atoms){
	if (typeof atom === 'string' && this.regex.test(atom)) {
		return {type: this.name, val: atom}
	}
}

function catchAllDefinition(token, atom, index, atoms){
	// Catch all elements that aren't BOF or EOF
	// And have the same type as the name(s) of this definition if one or more names exists
	var names = this.names || (this.name ? [this.name] : []);
	
	if (['BOF', 'EOF'].indexOf(atom.type) === -1 && (!names.length || names.indexOf(atom.type) !== -1))
		return atom;
}

// Atoms are single-character/single-value tokens
var definitionsList = [
	// First pass: character definitions
	[
		{
			name: 'dot',
			regex: /\./,
			definition: useRegexAsDefinition,
		},
		{
			name: 'letter',
			regex: /[a-zA-Z]/,
			definition: useRegexAsDefinition,
		},
		{
			name: 'digit',
			regex: /\d/,
			definition: useRegexAsDefinition,
		},
		{
			name: 'space',
			regex: /\s/,
			definition: useRegexAsDefinition,
		},
		{
			name: 'single-quote',
			regex: /'/,
			definition: useRegexAsDefinition,
		},
		{
			name: 'double-quote',
			regex: /"/,
			definition: useRegexAsDefinition,
		},
		{
			name: 'escape',
			regex: /\\/,
			definition: useRegexAsDefinition,
		},
		{
			name: 'unknown',
			regex: /./,
			definition: useRegexAsDefinition,
		}
	],
	// Second pass: elements
	[
		{
			name: 'string',
			definition: function(token, atom, index, atoms){
				var previousAtom = atoms[index-1];
				
				// If given token is a string
				if (token.type === this.name) {
					// Also if atom is not the delimiter for this string
					// Or if it is, but the previousAtom is an escape character
					if (atom.type !== token.delimiter || previousAtom.type === 'escape') {
						// Atom is not an unescaped escape character itself
						if (atom.type !== 'escape' || previousAtom.type === 'escape') {
							// Then then take atom's value because strings eat everything else
							token.val = token.val + atom.val;
							return token;
						}
						// Oh, if this atom is an unescaped escape then just return the token unmodified
						else {
							return token;
						}
					}
					// If atom is the delimiter for this string, 
					// Then let the atom fall away and theirfore ending the string
				}
				else {
					if (atom.type === 'single-quote' || atom.type === 'double-quote') {
						// Then return a new string token of this type with the delimiter tracked
						return {type: this.name, val: '', delimiter: atom.type};
					}
				}
			}
		},
		{
			name: 'number',
			definition: function(token, atom, index, atoms){
				var previousAtom = atoms[index-1];
				var nextAtom = atoms[index+1];
				
				if (atom.type === 'digit' && token.type !== 'word') {
					if (token.type === this.name) {
						token.val = token.val + atom.val;
						return token;
					}
					else {
						// Return new token
						return {type: this.name, val: atom.val, isFloat: false};
					}
				}
				// Convert integers into floats if a dot is received surrounded by digits
				else if (token.type === 'number' && !token.isFloat && atom.type === 'dot' && nextAtom.type === 'digit') {
					token.isFloat = true;
					token.val = token.val + atom.val;
					return token;
				}
			}
		},
		{
			name: 'word',
			definition: function(token, atom, index, atoms){
				if (atom.type === 'letter') {
					if (token.type === this.name) {
						token.val = token.val + atom.val;
						return token;
					}
					else {
						// Return new token
						return {type: this.name, val: atom.val};
					}
				}
				else if (atom.type === 'digit' && token.type === this.name) {
					token.val = token.val + atom.val;
					return token;
				}
			}
		},
		{
			name: 'spaces',
			definition: function(token, atom, index, atoms){
				if (atom.type === 'space') {
					if (token.type === this.name) {
						token.val = token.val + atom.val;
						return token;
					}
					else {
						// Return new token
						return {type: this.name, val: atom.val};
					}
				}
			}
		},
		{
			name: 'statement-terminator',
			definition: function(token, atom, index, atoms){
				// statement terminator must have final precedence.
				// This prevents the dot being used before other tokens (e.g. floats)
				if (atom.type === 'dot') {
					return {type: this.name, val: atom.val};
				}
				
				return false;
			}
		},
		{
			definition: catchAllDefinition,
		},
	],
	// Forth pass: semantic elements
	[
		{
			name: 'operator',
			definition: function(token, atom, index, atoms){
				var operators = ['is','of','to','in','as','and'];
				
				if (atom.type === 'word' && operators.indexOf(atom.val) !== -1) {
					var newToken = {
						type: this.name,
						val: atom.val,
					};
					
					return newToken;
				}
			}
		},
		{
			name: 'identifier',
			definition: function(token, atom, index, atoms){
				if (atom.type === 'word') {
					return {type: this.name, val: atom.val};
				}
			}
		},
		{
			names: ['statement-terminator', 'number', 'string'],
			definition: catchAllDefinition,
		},
	]
];