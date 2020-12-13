function *incrementCounter(initial: number, limit: number): Generator<number, void, unknown> {
	let current = initial;
	while (current <= limit) {
		yield current++;
	}
}

export default incrementCounter;
