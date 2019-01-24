import { TreeDataProvider, Event, TreeItem, EventEmitter, ProviderResult } from "vscode";
import { DBItem, TableItem, ColumnItem } from "./treeItem";

export type ItemInfo = DatabaseInfo | TableInfo | ColumnInfo;

export interface DatabaseInfo {
    path: string;
    tables: TableInfo[];
}

export interface TableInfo {
    database: string;
    name: string;
    type: string;
    columns: ColumnInfo[];
}

export interface ColumnInfo {
    database: string;
    table: string;
    name: string;
    type: string;
    notnull: boolean;
    pk: number;
    defVal: string;
}


export class ExplorerTreeProvider implements TreeDataProvider<ItemInfo> {

    private _onDidChangeTreeData: EventEmitter<ItemInfo | undefined> = new EventEmitter<ItemInfo | undefined>();
    readonly onDidChangeTreeData: Event<ItemInfo | undefined> = this._onDidChangeTreeData.event;

    private databaseList: DatabaseInfo[];

    constructor() {
        this.databaseList = [];
    }
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addToTree(database: DatabaseInfo) {
        let index = this.databaseList.findIndex(db => db.path === database.path);
        if (index < 0) {
            this.databaseList.push(database);
        } else {
            this.databaseList[index] = database;
        }
        this.refresh();
        return this.databaseList.length;
    }

    removeFromTree(dbPath: string) {
        let index = this.databaseList.findIndex(db => db.path === dbPath);
        if (index > -1) {
            this.databaseList.splice(index, 1);
        }
        this.refresh();
        
        return this.databaseList.length;
    }
    
    getTreeItem(item: ItemInfo): TreeItem {
        if ('tables' in item) {
            // Database
            return new DBItem(item.path);
        } else if ('columns' in item) {
            // Table
            return new TableItem(item.name, item.type);
        } else {
            // Column
            return new ColumnItem(item.name, item.type, item.notnull, item.pk, item.defVal);
        }
    }

    getDatabaseList() {
        return this.databaseList;
    }

    getChildren(item?: ItemInfo): ProviderResult<ItemInfo[]> {
        if (item) {
            if ('tables' in item) {
                // Database
                return item.tables;
            } else if ('columns' in item) {
                // Table
                return item.columns;
            } else {
                // Column
                return [];
            }
        } else {
            // Root
            return this.databaseList;
        }
    }

}