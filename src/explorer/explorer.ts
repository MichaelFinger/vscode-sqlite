import { Disposable, window, commands } from "vscode";
import { ExplorerTreeProvider, DatabaseInfo } from "./explorerTreeProvider";
import { Constants } from "../constants/constants";

export class Explorer implements Disposable {

    private disposable: Disposable;

    private explorerTreeProvider: ExplorerTreeProvider;

    constructor() {
        let subscriptions = [];

        this.explorerTreeProvider = new ExplorerTreeProvider();
        subscriptions.push(window.createTreeView(Constants.sqliteExplorerViewId, { treeDataProvider: this.explorerTreeProvider }));

        this.disposable = Disposable.from(...subscriptions);
    }

    add(database: DatabaseInfo): Number {
        let length = this.explorerTreeProvider.addToTree(database);
        if (length > 0) {
            commands.executeCommand( 'setContext', 'sqlite.explorer.show', true);
        }
        return length;
    }

    remove(dbPath: string): Number {
        let length = this.explorerTreeProvider.removeFromTree(dbPath);
        if (length === 0) {
            // close the explorer with a slight delay (it looks better)
            setTimeout(() => {
                commands.executeCommand( 'setContext', 'sqlite.explorer.show', false);
            }, 100);
        }
        return length;
    }

    list() {
        return this.explorerTreeProvider.getDatabaseList();
    }

    refresh() {
        this.explorerTreeProvider.refresh();
    }

    dispose() {
        this.disposable.dispose();
    }
}