export type ItemSchema = DatabaseSchema | TableSchema | ColumnSchema;

export interface DatabaseSchema {
    name: string;
    path: string;
    tables: TableSchema[];
}

export interface TableSchema {
    parent: DatabaseSchema;
    name: string;
    type: string;
    columns: ColumnSchema[];
}

export interface ColumnSchema {
    parent: TableSchema;
    name: string;
    type: string;
    notnull: boolean;
    pk: number;
    defVal: string;
}