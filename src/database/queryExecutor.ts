import { logger } from "../logging/logger";
import { SQLParser } from "./sqlparser";
import {spawnProcess} from "./sqliteProcess";
import { DatabasePath } from "./interfaces/databasePath";
import { CommandError } from "./errors/commandError";
import { QueryResult } from "./interfaces/queryResult";

/**
 * Execute a query on a database.
 * 
 * @param command Sqlite command to use to execute the query, it must be a valid sqlite command.
 * @param dbConfig Database configuration.
 * @param query The query to execute.
 * 
 * @returns Promise that resolves to a `QueryResult` if the query worked or there was an error in the query,
 *          or that rejects with error `CommandError` if there was an error in the command passed as argument.
 */
export function executeQuery(command: string, dbPath: DatabasePath, query: string): Promise<QueryResult> {
    if (!command) {
        return Promise.reject(new CommandError("SQLite command is not valid, unable to execute queries."));
    }

    logger.debug(`SQLite command: '${command}'`);
    logger.debug(`Database: ${dbPath.path}`);

    query = SQLParser.parse(query).join(' ');
    logger.info(`[QUERY] ${query}`);

    // TODO: query preprocess (ATTACH dbs)

    return spawnProcess(command, dbPath.path, query);
}