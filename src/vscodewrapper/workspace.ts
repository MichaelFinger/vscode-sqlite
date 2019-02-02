import { TextDocument, window, workspace, ViewColumn, Selection } from "vscode";


export function createDocument(language: string, show?: boolean): Thenable<TextDocument> {
    return workspace.openTextDocument({language: language}).then(sqlDocument => {
        if (show) {
            window.showTextDocument(sqlDocument, ViewColumn.One);
        }
        return sqlDocument;
    });
}

export function getEditorDocument(...languageList: string[]): TextDocument | undefined {
    if (!window.activeTextEditor) {
        return;
    }

    let document = window.activeTextEditor.document;

    if (languageList.length === 0) {
        return document;
    }

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