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
	U_8  = 1,
	U_16 = 2,
	U_32 = 4,
	U_64 = 8,

	I_8  = 1,
	I_16 = 2,
	I_32 = 4,
	I_64 = 8,

	F_32 = 4,
	F_64 = 8,
}

export default PropertyType;
