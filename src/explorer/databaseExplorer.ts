import { Disposable, window, commands } from "vscode";
import { ExplorerTreeProvider } from "./explorerTreeProvider";
import { Constants } from "../constants/constants";
import { SchemaDatabase } from "../shared/interfaces/schema";

export class DatabaseExplorer implements Disposable {

    private disposable: Disposable;

    private explorerTreeProvider: ExplorerTreeProvider;

    constructor() {
        let subscriptions = [];

        this.explorerTreeProvider = new ExplorerTreeProvider();
        subscriptions.push(window.createTreeView(Constants.sqliteExplorerViewId, { treeDataProvider: this.explorerTreeProvider }));

        this.disposable = Disposable.from(...subscriptions);
    }

    add(schemaDatabase: SchemaDatabase): Number {
        let length = this.explorerTreeProvider.addToTree(schemaDatabase);
        if (length > 0) {
            commands.executeCommand( 'setContext', 'sqlite.explorer.show', true);
        }
        return length;
    }

    remove(dbName: string): Number {
        let length = this.explorerTreeProvider.removeFromTree(dbName);
        if (length === 0) {
            // close the explorer with a slight delay (it looks better)
            setTimeout(() => {
                commands.executeCommand( 'setContext', 'sqlite.explorer.show', false);
            }, 100);
        }
        return length;
    }

    list() {
        return this.explorerTreeProvider.getSchemaDatabaseList();
    }

    refresh() {
        this.explorerTreeProvider.refresh();
    }

    dispose() {
        this.disposable.dispose();
    }
}