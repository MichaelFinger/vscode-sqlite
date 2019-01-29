import { TextDocument, window, workspace, ViewColumn, Selection } from "vscode";


export function createDocument(language: string, show?: boolean): Thenable<TextDocument> {
    return workspace.openTextDocument({language: language}).then(sqlDocument => {
        if (show) {
            window.showTextDocument(sqlDocument, ViewColumn.One);
        }
        return Promise.resolve(sqlDocument);
    });
}

export function getEditorDocument(...languageList: string[]): TextDocument | undefined {
    if (!window.activeTextEditor) {
        return;
    }

    if (languageList.length === 0) {
        return window.activeTextEditor.document;
    }

    let document = window.activeTextEditor.document;

    if (languageList.indexOf(document.languageId) < 0) {
        return;
    }

    return document;
}
    
export function getEditorSelection(): Selection | undefined {
    let selection = window.activeTextEditor? window.activeTextEditor.selection : undefined;
    selection = selection && selection.isEmpty? undefined : selection;
    return selection;
}