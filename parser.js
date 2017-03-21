module.exports = function parser(tokens){
	var tree = {
		statements: [{
			type: 'statement',
			tokens: [],
		}
	]};
	
	// Support for omitting the final statement-terminator
	// If the last token isn't a statement terminator, then add one.
	if (tokens[tokens.length-1].type !== 'statement-terminator') {
		tokens.push({type:'statement-terminator', val: null});
	}
	
	// Statements
	tokens.reduce(function(statements, token, index, tokens){
		// Get the latest statement in the statements accumulator
		var statement = statements[statements.length-1];
		
		// All tokens except for the statement-terminator...
		// are added to the statement's tokens array.
		// The tokens array will be processed into an expression...
		// at the point when a statement is terminated
		
		// Ask if the statement has not been terminated...
		if (token.type !== 'statement-terminator') {
			// Add a token to the statement's tokens
			statement.tokens.push(token);
		}
		// Statement is terminated so...
		else {
			// More than one token means there is an operation
			if (statement.tokens.length > 1) {
				// Process statement's tokens into an operations tree
				statement.expression = processTokensIntoOperation(statement.tokens);
			}
			// If there is one token, include the tokens as the statement's expression
			else if (statement.tokens.length) {
				statement.expression = statement.tokens[0];
			}
			// If there is zero tokens, the statement's expression is null
			else {
				statement.expression = null;
			}
			
			// Remove these tokens, we don't need them anymore
			delete statement.tokens;
			
			// If this isn't the last token in the stream then...
			if (index+1 !== tokens.length) {
				// Create a new statement and
				// push the new statement into the accumulator
				statements.push({
					type: 'statement',
					tokens: [],
				});
			}
		}
		
		// Return the accumulator (it's latest statement is modified)
		return statements;
	}, tree.statements);
	
	// console.log("TREEEEEEEEEEE")
	// console.log(JSON.stringify(tree, null, 2));
	
	return tree;
}


function processTokensIntoOperation(tokens, lastUsedOperator){
	// Get only operator tokens
	var operatorTokens = tokens
		.filter(function(token){
			return token.type === 'operator';
		});
	
	// Give each operator token order information
	operatorTokens.forEach(addOrderInformationToToken);
	
	if (!operatorTokens.length) {
		var tokenValues = tokens.map(function(token){ return token.val; })
		throw Error("Expecting operator in expression: `" + tokenValues.join(' ') + "`");
	}
	
	// Find the first operator token with the highest order
	var firstOperator = operatorTokens
		.reduce(function(foundToken, token){
			// Does the token win against the already foundToken
			if (token.orderRule(foundToken.order, lastUsedOperator)) {
				return token;
			}
			else {
				return foundToken;
			}
		});
	
	if (firstOperator === null) {
		var tokenValues = tokens.map(function(token){ return token.val; })
		throw Error("Unexpected sequence of tokens: `" + tokenValues.join(' ') + "`");
	}
	
	var indexOfFirstOperator = tokens.indexOf(firstOperator);
	var leftTokens = tokens.slice(0, indexOfFirstOperator);
	var rightTokens = tokens.slice(indexOfFirstOperator+1);
	
	var operation = createOperation(firstOperator, leftTokens, rightTokens);
	
	var unusedLeftTokens = operation.unusedLeftTokens;
	var unusedRightTokens = operation.unusedRightTokens;
	
	delete operation.unusedLeftTokens;
	delete operation.unusedRightTokens;
	
	if (Array.isArray(operation.left)) {
		if (operation.left.length > 1) {
			operation.left = processTokensIntoOperation(operation.left, operation.operator);
		}
		else {
			operation.left = operation.left[0];
		}
	}
	if (Array.isArray(operation.right)) {
		if (operation.right.length > 1) {
			operation.right = processTokensIntoOperation(operation.right, operation.operator);
		}
		else {
			operation.right = operation.right[0];
		}
	}
	
	if (Array.isArray(unusedLeftTokens) && unusedLeftTokens.length) {
		unusedLeftTokens.push(operation);
		
		operation = processTokensIntoOperation(unusedLeftTokens, operation.operator);
	}
	if (Array.isArray(unusedRightTokens) && unusedRightTokens.length) {
		unusedRightTokens.unshift(operation);
		
		operation = processTokensIntoOperation(unusedRightTokens, operation.operator);
	}
	
	return operation;
}

function createOperation(operator, leftTokens, rightTokens){
	var operation = {
		type: 'operation',
		left: null,
		right: null,
		operator: operator
	};
	
	if (operator.greed === 'normal') {
		// left is the last token of the left tokens array
		operation.left = leftTokens[leftTokens.length-1];
		// right is the first token of the right tokens array
		operation.right = rightTokens[0];
		
		// Keep unused tokens
		operation.unusedLeftTokens = leftTokens.slice(0, leftTokens.length-1);
		operation.unusedRightTokens = rightTokens.slice(1);
	}
	
	if (operator.greed === 'left') {
		// left is  all the tokens of the left tokens array
		operation.left = leftTokens;
		// right is the first token of the right tokens array
		operation.right = rightTokens[0];
		
		// Keep unused tokens
		operation.unusedRightTokens = rightTokens.slice(1);
	}
	
	if (operator.greed === 'right') {
		// left is the last token of the left tokens array
		operation.left = leftTokens[leftTokens.length-1];
		// right is all the tokens of the right tokens array
		operation.right = rightTokens;
		
		// Keep unused tokens
		operation.unusedLeftTokens = leftTokens.slice(0, leftTokens.length-1);
	}
	
	if (operator.greed === 'both') {
		// left is the last token of the left tokens array
		operation.left = leftTokens;
		// right is all the tokens of the right tokens array
		operation.right = rightTokens;
	}
	
	return operation;
}

/**
 * Highly Sophisticated Order/Rules engine
 */

function addOrderInformationToToken(operatorToken){
	// Greed...
	// Tokens with right greediness
	if (operatorToken.val === 'is') {
		operatorToken.greed = 'right';
	}
	// Tokens with left greediness
	else if (operatorToken.val === 'of') {
		operatorToken.greed = 'both';
	}
	// Tokens with normal greediness
	else {
		operatorToken.greed = 'normal';
	}
	
	// Order...
	
	// Default order for all tokens
	operatorToken.order = 0;
	
	if (operatorToken.val === 'is' || operatorToken.val === 'of') {
		operatorToken.order = 2;
	}
	else if (operatorToken.val === 'as') {
		operatorToken.order = 1;
	}
	
	// Order Rules...
	
	// Default order rule for all tokens
	operatorToken.orderRule = orderRules.proceedLessThan;
	
	if (operatorToken.val === 'of') {
		operatorToken.orderRule = orderRules.createRuleFromConditions({
			conditions: {
				lastUsedOperator: {
					mustBeDifferntFrom: operatorToken.val,
					mustBeSameOrder: true,
				},
			},
			conditionsMet: orderRules.proceedLessThanOrEqual,
			conditionsNotMet: orderRules.proceedLessThan
		});
	}
	
	// For debugging purposes
	operatorToken.id = 'abcdefghijklmnopqrstuvwxyz'.split('')[Math.round(26 * Math.random())]
	
	return operatorToken;
}

var orderRules = {
	// Defaault Order Rule states that order must be greater than comparison order
	proceedLessThan: function(comparisonOrder){
		return this.order > comparisonOrder;
	},
	proceedLessThanOrEqual: function(comparisonOrder){
		return this.order >= comparisonOrder;
	},
	
	// Special precedence over other operators of the same order.
	// If last operation wasn't the same operation as this,
	// and this operator has the same order as the last operation,
	// then this operator will preceed operators with the same order or lesser order.
	// Otherwise, follow regular precedence rules.
	createRuleFromConditions: function(options){
		var conditions = options.conditions;
		
		return function(comparisonOrder, lastUsedOperator){
			if (
				// First check if there is a lastUsedOperator condition and a lastUsedOperator provided
				(conditions.lastUsedOperator && lastUsedOperator)
				// LUO is not the same conditions.mustBeDifferntFrom
				&& (!conditions.lastUsedOperator.mustBeDifferntFrom || lastUsedOperator.val !== conditions.lastUsedOperator.mustBeDifferntFrom)
				// LUO is the same order
				&& (!conditions.lastUsedOperator.mustBeSameOrder || lastUsedOperator.order === this.order))
			{
				// Follow conditionsMet rule
				return options.conditionsMet.bind(this)(comparisonOrder)
			}
			
			// Follow conditionsNotMet rule
			return options.conditionsNotMet.bind(this)(comparisonOrder);
		}
	},
}