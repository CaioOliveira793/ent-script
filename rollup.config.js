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
				plugins: [
					terser(),
				]
			}, {
				file: pkg.main,
				format: 'cjs',
				exports: 'default',
				sourcemap: true
			}, {
				file: pkg.module,
				format: 'es',
				sourcemap: true
			}
		],
		plugins: [
			typescript()
		]
	}
];
