import type { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, SchematicsException } from '@angular-devkit/schematics';

import * as glob from 'glob';
import type { Schema } from './schema';

import { Readable, Writable } from 'stream';
import { delint, getClassByStyle } from './util/util';
import RewritingStream = require('parse5-html-rewriting-stream');

function cspMigration(_options: Schema): Rule {
	return (_tree: Tree, _context: SchematicContext) => {
		_context.logger.info(_options.continueScriptExecution ? `Continuing with migration: dry-run=${!_options.continueScriptExecution}` : `Continuing with migration in memory: dry-run=${!_options.continueScriptExecution}`);

		return chain([getPrefferedSettings(_options), migrateInlineTemplateComponents(_options), readHtmlFiles(_options)]);
	};
}

function getPrefferedSettings(_options: Schema): Rule {
	return (_tree: Tree, _context: SchematicContext) => {
		// If preffered style format is missing identify current styleExtension from angular.json
		// Default: css
		if (_options.prefferedStyleFormat !== null) {
			const workspaceConfigBuffer = _tree.read('/angular.json');
			if (workspaceConfigBuffer == null) {
				throw new SchematicsException('Not an Angular CLI project');
			}
			const workspaceConfig = JSON.parse(workspaceConfigBuffer.toString());
			const projectName = workspaceConfig.defaultProject;
			const project = workspaceConfig.projects[projectName];
			const workspaceSchematics = project?.schematics || workspaceConfig.schematics;
			const defaultProjectPath = `/${project.sourceRoot}/`;
			const lastPosOfPathDelimiter = defaultProjectPath.lastIndexOf('/');
			_options.srcRoot = defaultProjectPath.substring(0, lastPosOfPathDelimiter + 1);

			if (!workspaceSchematics) {
				_context.logger.info('No schematics options for preffered style format found, using CSS as default');
				_options.prefferedStyleFormat = 'css';
				return _tree;
			}

			const componentSchematics = workspaceSchematics['@schematics/angular:component'];
			if (componentSchematics !== null) {
				_options.prefferedStyleFormat = componentSchematics.style;
			}
		}
		_context.logger.info(`-------------------------------------------------------------`);
		_context.logger.info(`\nPreffered style format:-	${_options.prefferedStyleFormat?.toString().toUpperCase()}`);
		_context.logger.info(`\nDefault source root:-		${_options.srcRoot}`);
		return _tree;
	};
}

function readHtmlFiles(_options: Schema): Rule {
	return (tree: Tree) => {
		const filePaths = glob.sync(`.${_options.srcRoot}/**/*.html`);
		console.log('filePaths.length', filePaths.length);
		const filteredFilePaths = filePaths.filter((htmlFile) => {
			const hasTsFile = tree.exists(htmlFile.replace(/\.html$/gi, '.ts'));
			if (htmlFile.indexOf('index.html') === -1 && !hasTsFile) {
				console.log(`Couldn't find corresponding TS file for ${htmlFile}`);
			}
			return hasTsFile;
		});
		console.log('filteredFilePaths.length', filteredFilePaths.length);
		return tree;
	};
}

function migrateInlineTemplateComponents(_options: Schema): Rule {
	return (tree: Tree) => {
		const filePaths = glob.sync(`.${_options.srcRoot}/**/*.ts`);
		filePaths.map((filePath: string) => {
			// Check if file has @Component
			const content = tree.read(filePath)?.toString();
			const isComponent = content && content.indexOf('@Component') > -1;

			// Check only component files
			if (!isComponent) {
				return;
			}

			updateTsFile(_options, tree, filePath, content);
		});
		return tree;
	};
}

export function updateTsFile(_options: Schema, tree: Tree, filePath: string, content: string) {
	const { decorator, template, templateUrl, isTemplate } = delint(filePath, content);
	let buffer: Buffer;
	if (isTemplate) {
		console.log(`isTemplate -->  Decorator ${decorator}, template: ${template.slice(0, 10)}...`);
	} else {
		// Create new style map per file
		const styleMap = new Map<string, string>();
		const rewriter = new RewritingStream();
		buffer = tree.read(templateUrl);
		if (buffer === null) {
			throw new SchematicsException(`Could not read index file: ${filePath}`);
		}
		rewriter.on('startTag', (startTag: { attrs: { name: string; value: string }[] }) => {
			if (_options.updateInlineStyles) {
				const styleIdx = startTag.attrs?.findIndex((x) => x.name?.toLocaleLowerCase() === 'style');

				if (styleIdx > -1) {
					const styleAttr = startTag.attrs.splice(styleIdx, 1);
					const styles = styleAttr[0].value || '';
					console.log('Styles -->', styles);
					const stylesList = styles
						.trim()
						.split(';') // Split individual styles by ;
						.map((k) =>
							k // Format individual styles
								?.trim()
								.split(':')
								.map((j) => j?.trim())
								.join(': ')
						)
						.filter((l) => l !== ''); // Filter empty styles
					const finalStyle =
						stylesList.length > 1
							? stylesList // As inline styles have higher specificity to avoid styles from breaking we will add !important.
									.sort() // Alpha sort properties
									.join(' !important;')
							: `${stylesList[0]} !important`;
					const className = getClassByStyle(_options.classPrefix, finalStyle, styleMap);
					const classAttr = startTag.attrs.find((x) => x.name?.toLocaleLowerCase() === 'class');
					if (classAttr) {
						classAttr.value += ' ' + className;
					} else {
						startTag.attrs = [...startTag.attrs, { name: 'class', value: className }];
					}
				}
			}

			if (_options.prefferedStyleFormat) {
				// TODO:- Inject style within angular.component.ts file based on prefferedStyleFormat.
			}
			rewriter.emitStartTag(startTag);
		});

		return new Promise<void>((resolve) => {
			// Convert to readable streams out of iterators
			const input = new Readable({
				encoding: 'utf8',
				read(): void {
					this.push(buffer);
					this.push(null);
				},
			});

			const chunks: Buffer[] = [];
			const output = new Writable({
				write(chunk: string | Buffer, encoding: BufferEncoding, callback: () => void): void {
					chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk);
					callback();
				},
				final(callback: (error?: Error) => void): void {
					const full = Buffer.concat(chunks);
					tree.overwrite(templateUrl, full.toString());
					callback();
					resolve();
				},
			});

			input.pipe(rewriter).pipe(output);
		});
	}
}

exports.cspMigration = cspMigration;
