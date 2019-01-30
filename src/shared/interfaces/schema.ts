import { Database } from "./database";

export type SchemaItem = SchemaDatabase | SchemaTable | SchemaColumn;

export interface SchemaDatabase {
    database: Database;
    tables: SchemaTable[];
}

export interface SchemaTable {
    parent: SchemaDatabase;
    name: string;
    type: string;
    columns: SchemaColumn[];
}

export interface SchemaColumn {
    parent: SchemaTable;
    name: string;
    type: string;
    notnull: boolean;
    pk: number;
    defVal: string;
}