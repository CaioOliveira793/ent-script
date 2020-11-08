const LITTLE_ENDIAN = ((): boolean => {
	const buffer = new ArrayBuffer(2);
	new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
	return new Int16Array(buffer)[0] === 256;
})();

export default LITTLE_ENDIAN;
