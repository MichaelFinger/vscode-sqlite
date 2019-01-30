import { window, InputBoxOptions } from 'vscode';

export function showQueryInputBox(dbName: string) {
    const options: InputBoxOptions = {
        placeHolder: `Your query here (database: ${dbName})`
    };
    return window.showInputBox(options);
}