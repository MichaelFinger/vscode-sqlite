import { executeQuery } from "./queryExecutor";
import { DatabasePath } from "./interfaces/databasePath";
import { DatabaseSchema, ColumnSchema } from "./interfaces/databaseSchema";

/**
 * Retrieve the schema of a database.
 * 
 * The schema is retrieved in two steps:
 * 1. we find all the tables and views of the database (using sqlite_master)
 * 2. we find the columns of each table found in the first step (using PRAGMA table_info)
 * 
 * @param command Sqlite command to use to retrieve the schema, it must be a valid sqlite command.
 * @param dbConfig Database configuration.
 * 
 * @returns Promise that resolves to the `DatabaseSchema` if there was no error,
 *          or that rejects with error `CommandError` or `QueryError` if there was any error when executing the queries.
 */
export function retrieveSchema(command: string, dbPath: DatabasePath): Promise<DatabaseSchema> {
    let databaseSchema: DatabaseSchema = {
        name: dbPath.name,
        path: dbPath.path,
        tables: []
    };

    // query to find all tables and views in the database, ordering them by name and by type
    const tablesQuery = `SELECT name, type FROM sqlite_master WHERE type="table" OR type="view" ORDER BY type ASC, name ASC;`;

    return executeQuery(command, dbPath, tablesQuery).then(({resultSet, error}) => {
        resultSet = resultSet? resultSet : [];

        if (error) {
            return Promise.reject(error);
        }

        if (resultSet.length === 0) {
            // there are no tables in the db, no need to execute other queries
            return Promise.resolve({resultSet: []});
        }
        
        databaseSchema.tables = resultSet[0].rows.map(row => ({parent: databaseSchema, name: row[0], type: row[1], columns: []}) );

        // query to find the columns of the tables
        let columnsQuery = databaseSchema.tables.map(table => `PRAGMA table_info('${table.name}');`).join('');

        return executeQuery(command, dbPath, columnsQuery);
    }).then(({resultSet, error}) => {
        resultSet = resultSet? resultSet : [];

        if (error) {
            return Promise.reject(error);
        }

        resultSet.forEach(result => {
            // TODO: make this part more readable
            let tableName = result.stmt.replace(/.+\(\'?(\w+)\'?\).+/, '$1'); // extract the table name from the statement
            for(let i=0; i<databaseSchema.tables.length; i++) {
                if (databaseSchema.tables[i].name === tableName) {
                    databaseSchema.tables[i].columns = result.rows.map(row => {
                        return {
                            parent: databaseSchema.tables[i],
                            name: row[result.header.indexOf('name')],
                            type: row[result.header.indexOf('type')].toUpperCase(),
                            notnull: row[result.header.indexOf('notnull')] === '1' ? true : false,
                            pk: Number(row[result.header.indexOf('pk')]) || 0,
                            defVal: row[result.header.indexOf('dflt_value')]
                        } as ColumnSchema;
                    });
                    break;
                }
            }
        });

        return Promise.resolve(databaseSchema);
    });
}