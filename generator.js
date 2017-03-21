var beautifier = {
	newline: '\n'
}

module.exports = function generator(tree){
	var statements = tree.statements;
	
	var output = "";
	
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
	return token.val;
}

function generateString(token){
	if (token.delimiter === 'single-quote') {
		var delimiter = "'";
	}
	if (token.delimiter === 'double-quote') {
		var delimiter = '"';
	}
	
	return [delimiter, token.val.replace(new RegExp(delimiter, 'g'), "\\"+delimiter), delimiter].join('')
}

function generateNumber(token){
	return token.val;
}

function generateOperation(operatorToken, leftToken, rightToken){
	var operator = operators[operatorToken.val];
	
	var left = generateExpression(leftToken);
	var right = generateExpression(rightToken);
	
	// Debug operator
	var operator = function(left, right){
		return ['(', left, ' ', operatorToken.val, ' ', right, ')'].join('');
	}
	
	return operator(left, right);
}

var operators = {
	'is': function(left, right){
		return [left, ' = ', '(', right, ')'].join('');
	},
	'of': function(left, right){
		return ['(', right, ') => { return ', left, '; }'].join('');
	},
	'to': function(left, right){
		return [right, '(', structure(left), ')'].join('');
	},
	'in': function(left, right){
		return [right, '.', left].join('');
	},
	'as': function(left, right){
		return ['{', right, ':', left, '}'].join('');
	},
	'and': function(left, right){
		console.log(left, right)
		return [left, right];
	},
}


function structure(operand){
	var struct = {};
	
	
	
	return operand;
}