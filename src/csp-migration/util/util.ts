import * as ts from 'typescript';

export function randomClassGenerator(prefix: string, length = 6): string {
	let result = prefix + '-';
	const characterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		result += characterSet.charAt(Math.floor(Math.random() * characterSet.length));
	}

	return result;
}

export function getClassByStyle(prefix = 'csp-dyn', searchValue: string, classList: Map<string, string>): string {
	for (const [key, value] of classList.entries()) {
		if (value === searchValue) {
			return key;
		}
	}
	const newClassName = randomClassGenerator(prefix);
	classList.set(newClassName, searchValue);
	return newClassName;
}

export function delint(filePath: string, fileContent: string): { decorator: ts.Node; template: string; templateUrl: string; isTemplate: boolean } {
	const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.ES2015, /*setParentNodes */ true);
	let decorator: ts.Node = null;
	let templateUrl = '';
	let template = '';
	let isTemplate = false;
	delintNode(sourceFile);
	function delintNode(node: ts.Node) {
		if (!decorator && node.kind === ts.SyntaxKind.Decorator && node.getText().indexOf('@Component') > -1) {
			decorator = node;
			ts.forEachChild(node, findProperty);
		} else {
			ts.forEachChild(node, delintNode);
		}
	}

	function findProperty(node: ts.Node) {
		// Format for PropertyAssignment is '[<identifier>, <:>, "<value>"] Ex:- templateUrl: "./app.component.html"'
		if (decorator !== null && node.kind === ts.SyntaxKind.PropertyAssignment && node.getChildCount() === 3) {
			if (node.getText().indexOf('template') > -1) {
				isTemplate = node.getChildAt(0).kind === ts.SyntaxKind.Identifier && node.getChildAt(0)?.getText() === 'template';
				if (isTemplate) {
					template = node.getChildAt(2)?.getText();
				} else {
					templateUrl = filePath.substring(0, filePath.lastIndexOf('/') + 1) + node.getChildAt(2).getText().replace(/["']/gi, '');
				}
			} else if (node.getText().indexOf('style') > -1) {
				// TODO:- Move compouted styles to files based on preference
			}
		} else {
			ts.forEachChild(node, findProperty);
		}
	}
	return { decorator, template, templateUrl, isTemplate };
}
