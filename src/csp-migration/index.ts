import type { SchematicContext, Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';
import type { Schema, StyleExtension } from './schema';

function cspMigration(_options: Schema) {
	return (_tree: Tree, _context: SchematicContext) => {
		const prefferedStyleFormat = getPrefferedStyleExtension(_options, _tree, _context);
		_context.logger.info(`Preffered style format is ${prefferedStyleFormat?.toString().toUpperCase()}`);

		_context.logger.info(`-------------------------------------------------------------`);
		if (_options.updateInlineStyles) {
			_context.logger.info(`Enabled updateInlineStyles`);
		}
		if (_options.updateInlineScripts) {
			_context.logger.info(`Enabled updateInlineScripts`);
		}
		if (_options.classPrefix) {
			_context.logger.info(`Class prefix ${_options.classPrefix}`);
		}
		_context.logger.info(JSON.stringify(_options));
	};
}

function getPrefferedStyleExtension(_options: Schema, _tree: Tree, _context: SchematicContext): StyleExtension {
	// If preffered style format is missing identify current styleExtension from angular.json
	// Default: css
	let prefferedStyleFormat = _options.prefferedStyleFormat ?? 'css';
	if (_options.prefferedStyleFormat !== null) {
		const workspaceConfigBuffer = _tree.read('/angular.json');
		if (workspaceConfigBuffer == null) {
			throw new SchematicsException('Not an Angular CLI project');
		}
		const workspaceConfig = JSON.parse(workspaceConfigBuffer.toString());
		const projectName = workspaceConfig.defaultProject;
		const project = workspaceConfig.projects[projectName];
		const workspaceSchematics = project?.schematics || workspaceConfig.schematics;

		if (!workspaceSchematics) {
			console.log('No schematics options for preffered style format found, using CSS as default');
			return 'css';
		}

		const componentSchematics = workspaceSchematics['@schematics/angular:component'];
		if (componentSchematics !== null) {
			prefferedStyleFormat = componentSchematics.style;
		}
	}
	return prefferedStyleFormat;
}

exports.cspMigration = cspMigration;
