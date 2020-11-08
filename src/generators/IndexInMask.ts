function* generatorIndexInMask(mask: number): Generator<number, void, unknown> {
	for (let index = 0; index < 32; index++) {
		if ((mask & 1) === 1)
			yield index;
		mask >>= 1;
	}
}

export default generatorIndexInMask;
