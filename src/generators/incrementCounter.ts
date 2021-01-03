function *incrementCounter(initial: number, limit: number, increment = 1): Generator<number, void, unknown> {
	let current = initial;
	while (current <= limit) {
		yield current;
		yield current += increment;
	}
}

export default incrementCounter;
