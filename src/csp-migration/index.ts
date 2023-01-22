import { SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { Schema, StyleExtension } from './schema';

function cspMigration(_options: Schema) {
	return (_tree: Tree, _context: SchematicContext) => {
		const prefferedStyleFormat = getPrefferedStyleExtension(_options, _tree, _context);
		_context.logger.info(`Preffered style format is ${prefferedStyleFormat?.toString().toUpperCase()}`);
	};
}
exports.cspMigration = cspMigration;

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
		const workspaceSchematics = project !== null ? (project.schematics !== null ? project.schematics : workspaceConfig.schematics) : undefined;
		if (workspaceSchematics === null) {
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
