import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
	{
		input: 'src/index.ts',
		output: [
			{
				name: 'ent_script',
				file: pkg.browser,
				format: 'umd',
				exports: 'named',
				plugins: [
					terser(),
				]
			}, {
				file: pkg.main,
				format: 'cjs',
				exports: 'named',
				sourcemap: true
			}, {
				file: pkg.module,
				format: 'es',
				exports: 'named',
				sourcemap: true
			}
		],
		plugins: [
			typescript()
		]
	}
];
