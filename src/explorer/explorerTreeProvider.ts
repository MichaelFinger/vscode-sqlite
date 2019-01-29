import { TreeDataProvider, Event, TreeItem, EventEmitter, ProviderResult } from "vscode";
import { DBItem, TableItem, ColumnItem } from "./treeItem";

interface ItemInfo {
    name: string;
}

export interface DatabaseInfo extends ItemInfo {
    tables: TableInfo[];
}

export interface TableInfo extends ItemInfo {
    type: string;
    columns: ColumnInfo[];
}

export interface ColumnInfo extends ItemInfo {
    type: string;
    notnull: boolean;
    pk: number;
    defVal: string;
}

export class ExplorerTreeProvider<T extends DatabaseInfo> implements TreeDataProvider<ItemInfo> {

    private _onDidChangeTreeData: EventEmitter<ItemInfo | undefined> = new EventEmitter<ItemInfo | undefined>();
    readonly onDidChangeTreeData: Event<ItemInfo | undefined> = this._onDidChangeTreeData.event;

    private databaseList: T[];

    constructor() {
        this.databaseList = [];
    }
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addToTree(database: T) {
        let index = this.databaseList.findIndex(db => db.name === database.name);
        if (index < 0) {
            this.databaseList.push(database);
        } else {
            this.databaseList[index] = database;
        }
        this.refresh();
        return this.databaseList.length;
    }

    removeFromTree(dbName: string) {
        let index = this.databaseList.findIndex(db => db.name === dbName);
        if (index > -1) {
            this.databaseList.splice(index, 1);
        }
        this.refresh();
        
        return this.databaseList.length;
    }
    
    getTreeItem(item: ItemInfo): TreeItem {
        if ('tables' in item) {
            // Database
            let dbInfo = item as DatabaseInfo;
            return new DBItem(dbInfo.name);
        } else if ('columns' in item) {
            // Table
            let tableInfo = item as TableInfo;
            return new TableItem(tableInfo.name, tableInfo.type);
        } else {
            // Column
            let colInfo = item as ColumnInfo;
            return new ColumnItem(colInfo.name, colInfo.type, colInfo.notnull, colInfo.pk, colInfo.defVal);
        }
    }

    getDatabaseList() {
        return this.databaseList;
    }

    getChildren(item?: ItemInfo): ProviderResult<ItemInfo[]> {
        if (item) {
            if ('tables' in item) {
                // Database
                let dbInfo = item as DatabaseInfo;
                return dbInfo.tables;
            } else if ('columns' in item) {
                // Table
                let tableInfo = item as TableInfo;
                return tableInfo.columns;
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