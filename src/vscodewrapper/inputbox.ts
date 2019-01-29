import { window } from 'vscode';

export function showInputBox(hint?: string) {
    /*
    const options: InputBoxOptions = {
        placeHolder: `Your query here (database: ${dbPath})`
    };
    */
    return window.showInputBox({placeHolder: hint});
}