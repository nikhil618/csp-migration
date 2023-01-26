export interface Schema {
	srcRoot?: string;
	continueScriptExecution: boolean;
	prefferedStyleFormat?: StyleExtension;
	updateInlineStyles?: boolean;
	updateInlineScripts?: boolean;
	classPrefix?: string;
}

export type StyleExtension = 'css' | 'scss';
