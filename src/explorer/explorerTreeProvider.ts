import { TreeDataProvider, Event, TreeItem, EventEmitter, ProviderResult } from "vscode";
import { DatabaseItem, TableItem, ColumnItem } from "./treeItem";
import { SchemaItem, SchemaDatabase, SchemaTable, SchemaColumn } from "../shared/interfaces/schema";

export class ExplorerTreeProvider implements TreeDataProvider<SchemaItem> {

    private _onDidChangeTreeData: EventEmitter<SchemaItem | undefined> = new EventEmitter<SchemaItem | undefined>();
    readonly onDidChangeTreeData: Event<SchemaItem | undefined> = this._onDidChangeTreeData.event;

    private schemaDatabaseList: SchemaDatabase[];

    constructor() {
        this.schemaDatabaseList = [];
    }
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addToTree(schemaDatabase: SchemaDatabase) {
        let index = this.schemaDatabaseList.findIndex(sdb => sdb.database.name === schemaDatabase.database.name);
        if (index < 0) {
            this.schemaDatabaseList.push(schemaDatabase);
        } else {
            this.schemaDatabaseList[index] = schemaDatabase;
        }
        this.refresh();
        return this.schemaDatabaseList.length;
    }

    removeFromTree(dbName: string) {
        let index = this.schemaDatabaseList.findIndex(sdb => sdb.database.name === dbName);
        if (index > -1) {
            this.schemaDatabaseList.splice(index, 1);
        }
        this.refresh();
        
        return this.schemaDatabaseList.length;
    }
    
    getTreeItem(item: SchemaItem): TreeItem {
        if ('tables' in item) {
            // Database
            let schemaDatabase = item as SchemaDatabase;
            return new DatabaseItem(schemaDatabase.database.path, schemaDatabase.database.name);
        } else if ('columns' in item) {
            // Table
            let schemaTable = item as SchemaTable;
            return new TableItem(schemaTable.name, schemaTable.type);
        } else {
            // Column
            let schemaColumn = item as SchemaColumn;
            return new ColumnItem(schemaColumn.name, schemaColumn.type, schemaColumn.notnull, schemaColumn.pk, schemaColumn.defVal);
        }
    }

    getSchemaDatabaseList() {
        return this.schemaDatabaseList;
    }

    getChildren(item?: SchemaItem): ProviderResult<SchemaItem[]> {
        if (item) {
            if ('tables' in item) {
                // Database
                let schemaDatabase = item as SchemaDatabase;
                return schemaDatabase.tables;
            } else if ('columns' in item) {
                // Table
                let schemaTable = item as SchemaTable;
                return schemaTable.columns;
            } else {
                // Column
                return [];
            }
        } else {
            // Root
            return this.schemaDatabaseList;
        }
    }

}