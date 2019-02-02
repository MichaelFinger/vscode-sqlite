import { StatusBarItem, window, StatusBarAlignment, Disposable } from "vscode";
import { Database } from "../shared/interfaces/database";

export class DatabaseStatusBarItem implements Disposable {
    private disposable: Disposable;
    private statusBarItem: StatusBarItem;

    constructor(onClickCommand: string) {
        let subscriptions: Disposable[] = [];

        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
        this.statusBarItem.command = onClickCommand;
        subscriptions.push(this.statusBarItem);

        this.disposable = Disposable.from(...subscriptions);
    }
    
    show(database?: Database) {
        let dbName = database? database.name : 'No database';
        let dbPath = database? database.path : 'No database';
        
        this.statusBarItem.text = `SQLite: ${dbName}`;
        this.statusBarItem.tooltip = `SQLite: ${dbPath}`;

        this.statusBarItem.show();
    }

    hide() {
        this.statusBarItem.hide();
    }

    dispose() {
        this.disposable.dispose();
    }
}