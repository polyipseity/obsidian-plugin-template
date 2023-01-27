import builtins from "builtin-modules"
import esbuild from "esbuild"
import process from "node:process"
import sveltePlugin from "esbuild-svelte"
import sveltePreprocess from "svelte-preprocess"

const ARGV_PRODUCTION = 2,
	COMMENT = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD.
If you want to view the source, please visit the repository of this plugin.
*/`,
	production = process.argv[ARGV_PRODUCTION] === "production",
	options = {
		banner: { js: COMMENT },
		bundle: true,
		color: true,
		drop: [],
		entryPoints: ["sources/main.ts"],
		external: [
			"electron",
			"obsidian",
			"@codemirror/autocomplete",
			"@codemirror/collab",
			"@codemirror/commands",
			"@codemirror/language",
			"@codemirror/lint",
			"@codemirror/search",
			"@codemirror/state",
			"@codemirror/view",
			"@lezer/common",
			"@lezer/highlight",
			"@lezer/lr",
			"node:*",
			...builtins,
		],
		footer: { js: COMMENT },
		format: "cjs",
		jsx: "transform",
		legalComments: "inline",
		loader: { ".py": "text" },
		logLevel: "info",
		logLimit: 0,
		minify: production,
		outfile: "main.js",
		platform: "browser",
		plugins: [
			sveltePlugin({
				cache: "overzealous",
				compilerOptions: {
					accessors: false,
					css: "injected",
					customElement: false,
					dev: !production,
					enableSourcemap: {
						cs: !production,
						js: !production,
					},
					errorMode: "throw",
					format: "esm",
					generate: "dom",
					hydratable: false,
					immutable: true,
					legacy: false,
					loopGuardTimeout: 0,
					preserveComments: false,
					preserveWhitespace: false,
					varsReport: "full",
				},
				filterWarnings: () => true,
				fromEntryFile: false,
				include: /\.svelte$/ug,
				preprocess: [
					sveltePreprocess({
						aliases: [],
						globalStyle: {
							sourceMap: !production,
						},
						markupTagName: "template",
						preserve: [],
						replace: [],
						sourceMap: !production,
						typescript: {
							compilerOptions: {},
							handleMixedImports: false,
							reportDiagnostics: true,
							tsconfigDirectory: "./",
							tsconfigFile: "./tsconfig.json",
						},
					}),
				],
			}),
		],
		sourcemap: production
			? false
			: "inline",
		sourcesContent: true,
		target: "ES2018",
		treeShaking: true,
	}
if (production) {
	await esbuild.build(options)
} else {
	await (await esbuild.context(options)).watch({})
}
