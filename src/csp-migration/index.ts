import { externalSchematic, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function cspMigration(_options: any): Rule {
  const name = _options.name;
  console.log('Hello from your new schematic!', name);

  return (_tree: Tree, _context: SchematicContext) => {
    return externalSchematic('@schematics/angular', 'ng-new', {
      name,
      version: '9.0.0',
      directory: name,
      routing: false,
      style: 'scss',
      inlineStyle: false,
      inlineTemplate: false
    });;
  };
}
