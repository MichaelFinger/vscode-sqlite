import { StatusBarItem, window, StatusBarAlignment, Disposable } from "vscode";
import { basename } from "path";

export class DatabaseStatusBar implements Disposable {
    private disposable: Disposable;
    private statusBarItem: StatusBarItem;

    constructor(command: string) {
        let subscriptions: Disposable[] = [];

        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
        this.statusBarItem.command = command;
        subscriptions.push(this.statusBarItem);

        this.disposable = Disposable.from(...subscriptions);
    }

    show(dbPath?: string, dbName?: string) {
        if (!dbPath) {
            dbPath = 'No database';
            dbName = 'No database';
        }

        if (!dbName) {
            dbName = basename(dbPath);
        }
        
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