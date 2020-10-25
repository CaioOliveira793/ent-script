export const enum PropertyType {
	U_INT_8        = 'U_8',
	BYTE           = U_INT_8,
	U_INT_16       = 'U_16',
	UNSIGNED_INT   = U_INT_16,
	U_INT_32       = 'U_32',
	U_INT_64       = 'U_64',

	INT_8          = 'I_8',
	INT_16         = 'I_16',
	INT            = INT_16,
	INT_32         = 'I_32',
	INT_64         = 'I_64',

	FLOAT_32       = 'F_32',
	FLOAT          = FLOAT_32,
	FLOAT_64       = 'F_64',
	DOUBLE         = FLOAT_64,
}

export enum PropertyTypeToSize {
	U_8  = 8,
	U_16 = 16,
	U_32 = 32,
	U_64 = 64,

	I_8  = 8,
	I_16 = 16,
	I_32 = 32,
	I_64 = 64,

	F_32 = 32,
	F_64 = 64,
}

export default PropertyType;
