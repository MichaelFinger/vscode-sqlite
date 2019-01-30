import { QuickPickItem, window, workspace } from "vscode";
import { Database } from "../shared/interfaces/database";

class DatabaseQuickPickItem implements QuickPickItem {
    label: string;
    description: string;
    detail?: string;
    picked?: boolean;
    
    constructor(public database: Database) {
        this.label = this.database.name;
        this.description = this.database.path;
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

export function pickListDatabase(databaseList: Database[]): Thenable<Database> {
    let items: DatabaseQuickPickItem[] = databaseList.map(db => new DatabaseQuickPickItem(db));
    return window.showQuickPick(items, {placeHolder: 'Choose a database.'}).then(item => {
        if (item) {
            return Promise.resolve(item.database);
        } else {
            return Promise.reject();
        }
    });
}

export function pickWorkspaceDatabase(databaseList: Database[], fileExtensions: string[], includeInMemoryDb: boolean): Thenable<Database> {
    let items: Array<DatabaseQuickPickItem|FileDialogQuickPickItem> = databaseList.map(db => new DatabaseQuickPickItem(db));

    let pattern = '**/*.{'+fileExtensions.join(",")+'}';
    return workspace.findFiles(pattern).then(filesUri => {
        let fileItems = filesUri.map(uri => new DatabaseQuickPickItem(Database.New(uri.fsPath)));
        items.push(...fileItems);
        // we put the database :memory: just before the file dialog
        items.push(new DatabaseQuickPickItem(Database.Memory()));
        // we put the file dialog as last
        items.push(new FileDialogQuickPickItem());
        
        return window.showQuickPick(items, {placeHolder: 'Choose a database.'});
    }).then(item => {
        if (item instanceof DatabaseQuickPickItem) {
            return Promise.resolve(item.database);
        } else if (item instanceof FileDialogQuickPickItem) {
            return window.showOpenDialog({filters: {"Database": fileExtensions}}).then(fileUri => {
                if (fileUri && fileUri.length > 0) {
                    let path = fileUri[0].fsPath;
                    let database = Database.New(path);
                    return Promise.resolve(database);
                } else {
                    return Promise.reject();
                }
            });
        } else {
            return Promise.reject();
        }
    });
}