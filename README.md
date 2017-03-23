# Re-verse

Reverse is a FP language for all Wizards alike.

https://medium.com/@sam_holmes/language-of-the-wizards-a38ac891ebf#.hk00se1y5

## The Goal

A human and computer language both written and spoken with a relatively flat learning curve. 
To acheive this goal means that Re-verse can be understood by computers and humans with ease, whether spoken or written.

## Project State

In early phase of development. Compiler needs finishing. Language needs documentation.

# TODO

- Runtime
	- Define all native functions (math and string functions, etc.)
- Tokenizer
	- Create definitions that relate one token to another in some way.
	- Have only one pass through the character stream.
	- As characters are tokenized, check for definitions that use them.
	- Pass any tokens to the atomizer along with the found definitions.