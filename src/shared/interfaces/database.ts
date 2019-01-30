import { basename } from "path";

/**
 * Database name and path.
 */
export interface Database {
    /**
     * The name used to identify this database. This is the name shown in explorer and quickpick.
     */
    name: string;
    /**
     * The database path.
     */
    path: string;
}

export namespace Database {
    /**
     * 
     * @param path The database path (default: `:memory:`)
     * @param name Name used to identify this database. This is the name shown in explorer and quickpick.
     *             (default: `basename(path)`)
     */
    export function New(path: string = ":memory:", name?: string): Database {
        let databasePath: Database = {
            path: path,
            name: name? name : basename(path)
        };
        
        return databasePath;
    }

    export function Memory() {
        return Database.New();
    }
}