export interface Schema {
	prefferedStyleFormat?: StyleExtension;
	updateInlineStyles?: boolean;
	updateInlineScripts?: boolean;
}

export type StyleExtension = 'css' | 'scss';
