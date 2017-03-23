var fs = require('fs');
var UglifyJS = require('uglifyjs');

var beautifier = {
	newline: '\n'
}

module.exports = function generator(tree){
	var statements = tree.statements;
	
	var output = runtimeCode() + nativeCode();
	
	statements.forEach(function(statement){
		output += generateStatement(statement);
	});
	
	return output;
}

function generateStatement(statement){
	var expression = statement.expression;
	
	// An expression that is not an operation is ignored by the compiler
	if (!expression)// || expression.type !== 'operation')
		return '';
	
	return generateExpression(expression) + ";" + beautifier.newline;
}

function generateExpression(expression){
	if (expression) {
		if (expression.type === 'identifier') {
			return generateIdentifier(expression);
		}
		if (expression.type === 'string') {
			return generateString(expression);
		}
		if (expression.type === 'number') {
			return generateNumber(expression);
		}
		if (expression.type === 'operation') {
			return generateOperation(expression.operator, expression.left, expression.right);
		}
	}
	else {
		return null;
	}
}

function generateIdentifier(token){
	return identify(token.val);
}

function generateString(token){
	if (token.delimiter === 'single-quote') {
		var delimiter = "'";
	}
	if (token.delimiter === 'double-quote') {
		var delimiter = '"';
	}
	
	var output = [delimiter, token.val.replace(new RegExp(delimiter, 'g'), "\\"+delimiter), delimiter].join('');
	
	// Escape newlines
	output = output.replace(/\n/g, '\\\n');
	
	// Make it a thing
	output = thingify(null, output);
	
	return output;
}

function generateNumber(token){
	var output = token.val;
	output = thingify(null, output);
	return output;
}

function generateOperation(operatorToken, leftToken, rightToken){
	var operator = operators[operatorToken.val];
	
	var left = generateExpression(leftToken);
	var right = generateExpression(rightToken);
	
	// Debug operator
	// var operator = function(left, right){
	// 	return ['(', left, ' ', operatorToken.val, ' ', right, ')'].join('');
	// }
	
	return operator(left, right);
}

var operators = {
	'is': function(left, right){
		return [left, '.is(', right, ', scope)'].join('');
	},
	'of': function(left, right){
		return thingify(null, ['((input) => { var scope = createScope(scope); destructure(', right, ', input, scope); return ', left, '; })'].join(''));
	},
	'to': function(left, right){
		if (left === null) {
			left = thingify(null, null);
		}
		return [left, '.to(', right, ')'].join('');
	},
	'in': function(left, right){
		return [left, '.in(', right, ')'].join('');
	},
	'as': function(left, right){
		return [left, '.as(', right, ')'].join(''); //[right, ':', left].join('');
	},
	'and': function(left, right){
		return [left, '.and(', right, ')'].join('');
	},
}

function thingify(identifier, value, key){
	identifier = identifier || 'null';
	
	if (key) {
		var keys = "{" + key + ":" + value + "}";
		var items = [];
	}
	else {
		var keys = "{}";
		var items = [value];
	}
	return ['(new Thing(', identifier, ', [', items.join(), '],', keys, '))'].join('');
}

function identify(identifier){
	return ['scope("', identifier, '")'].join('')
}


function runtimeCode(){
	var code = fs.readFileSync('./runtime.js', 'utf8');
	
	code = UglifyJS.minify(code, {fromString: true}).code;
	
	code += "\n// END OF RUNTIME\n\n";
	
	return code;
}

function nativeCode(){
	var code = fs.readFileSync('./native.js', 'utf8');
	
	code = UglifyJS.minify(code, {fromString: true}).code;
	
	code += "\n// END OF NATIVE\n\n";
	
	return code;
}