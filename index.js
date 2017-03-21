var fs = require('fs');
var stringify = require('json-stringify-safe');

var tokenizer = require('./tokenizer');
var parser = require('./parser');
var generator = require('./generator');


function compile(inputCode){
	// Frontend
	var tokens = tokenizer(inputCode);
	var tree = parser(tokens);
	
	// Backend
	var outputCode = generator(tree);
	
	return outputCode;
}

function error(err){
	console.log(err);
}


fs.readFile('test.rv', (err, file) => {
	var reverseCode = file.toString('utf8');
	
	var compiledFile = compile(reverseCode);
	
	try {
		var json = stringify(compiledFile, null, 2);
		
		console.log(json);
	}
	catch(e) {
		
	}
	
	fs.writeFile('output.js', compiledFile, (err) => {
		if (err) return error(err);
	})
})




/**
 * Backend Functions
 */

