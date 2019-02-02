import { window, InputBoxOptions } from 'vscode';

export function showInputBox(hint?: string): Thenable<string> {
    const options: InputBoxOptions = {
        placeHolder: hint
    };
    return window.showInputBox(options).then(input => {
        if (input) {
            return input;
        } else {
            return Promise.reject();
        }
    });
}