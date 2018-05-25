'use strict';

import { DatabaseStore } from '../database/databaseStore';
import { getSqlitePath } from '../utils/utils';
import { Uri, commands, ExtensionContext, Disposable } from 'vscode';
import { SQLiteExplorer } from '../explorer/explorer';
import { DBItem } from '../explorer/treeItem';

/**
 * Initialize controllers and register commands
 */
export class MainController implements Disposable {

    private databaseStore!: DatabaseStore;
    private explorer!: SQLiteExplorer;

    constructor(private context: ExtensionContext) {

    }

    dispose() {
        this.deactivate();
    }

    activate(): Promise<boolean> {
        /* register database commands */
        this.context.subscriptions.push(commands.registerCommand('extension.openDatabase', (dbUri: Uri) => {
            this.onOpenDatabase(dbUri.fsPath);
        }));
        this.context.subscriptions.push(commands.registerCommand('extension.closeDatabase', (dbItem: DBItem) => {
            this.onCloseDatabase(dbItem.dbPath);
        }));
        // register explorer commands
        this.context.subscriptions.push(commands.registerCommand('extension.addToExplorer', (dbPath: string) => {
            this.onAddToExplorer(dbPath);
        }));
        this.context.subscriptions.push(commands.registerCommand('extension.removeFromExplorer', (dbPath: string) => {
            this.onRemoveFromExplorer(dbPath);
        }));
        this.context.subscriptions.push(commands.registerCommand('extension.refreshExplorer', () => {
            this.onRefreshExplorer();
        }));

        return this.initialize();
    }

    deactivate() {
        // nothing to deactivate for now
    }

    private initialize(): Promise<boolean> {
        let self = this;

        return new Promise( (resolve, reject) => {
            const extensionPath = self.context.extensionPath;
    
            /* initialize DatabaseStore, Explorer */
            this.databaseStore = new DatabaseStore(getSqlitePath(extensionPath));
            this.explorer = new SQLiteExplorer(this.databaseStore);
    
            self.context.subscriptions.push(this.databaseStore);
            self.context.subscriptions.push(this.explorer);

            resolve(true);
        });
    }

    private onOpenDatabase(dbPath: string) {
        let database = this.databaseStore.openDatabase(dbPath);
        if (database) {
            commands.executeCommand('extension.addToExplorer', dbPath);
        }
    }

    private onCloseDatabase(dbPath: string) {
        this.databaseStore.closeDatabase(dbPath);
        commands.executeCommand('extension.removeFromExplorer', dbPath);
    }

    private onAddToExplorer(dbPath: string) {
        this.explorer.addToExplorer(dbPath);
    }

    private onRemoveFromExplorer(dbPath: string) {
        this.explorer.removeFromExplorer(dbPath);
    }

    private onRefreshExplorer() {
        this.explorer.refreshExplorer();
    }
}

