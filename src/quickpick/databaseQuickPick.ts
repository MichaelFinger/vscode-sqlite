import { QuickPickItem, window, workspace } from "vscode";
import { basename } from "path";

interface DatabaseItem {
    name: string;
    path: string;
}

class DatabaseQuickPickItem implements DatabaseItem, QuickPickItem {
    name: string;
    path: string;
    label: string;
    description: string;
    detail?: string;
    picked?: boolean;
    
    constructor(item: DatabaseItem) {
        this.name = item.name;
        this.path = item.path;
        this.label = this.name;
        this.description = this.path;
    }
}

class FileDialogQuickPickItem implements QuickPickItem {
    label: string;
    description: string;
    detail?: string;
    picked?: boolean;
    
    constructor() {
        this.label = "Choose database from file";
        this.description = "";
    }
}

export function pickListDatabase(dbList: DatabaseItem[]): Thenable<DatabaseItem> {
    let items: DatabaseQuickPickItem[] = dbList.map(item => new DatabaseQuickPickItem(item));
    return window.showQuickPick(items, {placeHolder: 'Choose a database.'}).then(item => {
        if (item) {
            return Promise.resolve(item);
        } else {
            return Promise.reject();
        }
    });
}

export function pickWorkspaceDatabase(dbList: DatabaseItem[], fileExtensions: string[]): Thenable<DatabaseItem> {
    let items: Array<DatabaseQuickPickItem|FileDialogQuickPickItem> = dbList.map(item => new DatabaseQuickPickItem(item));

    let pattern = '**/*.{'+fileExtensions.join(",")+'}';
    return workspace.findFiles(pattern).then(filesUri => {
        let fileItems = filesUri.map(uri => new DatabaseQuickPickItem({name: basename(uri.fsPath), path: uri.fsPath}));
        items.push(...fileItems);
        items.push(new FileDialogQuickPickItem());
        return items;
    }).then(items => {
        return window.showQuickPick(items, {placeHolder: 'Choose a database.'});
    }).then(item => {
        if (item instanceof DatabaseQuickPickItem) {
            return Promise.resolve(item);
        } else if (item instanceof FileDialogQuickPickItem) {
            return window.showOpenDialog({filters: {"Database": fileExtensions}}).then(fileUri => {
                if (fileUri) {
                    let path = fileUri[0].fsPath;
                    let fileItem: DatabaseItem = {name: basename(path), path: path};
                    return Promise.resolve(fileItem);
                } else {
                    return Promise.reject();
                }
            });
        } else {
            return Promise.reject();
        }
    });
}