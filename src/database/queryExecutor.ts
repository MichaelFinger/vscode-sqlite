import { logger } from "../logging/logger";
import { SQLParser } from "./sqlparser";
import {spawnProcess} from "./sqlite/sqliteProcess";
import { Database } from "../shared/interfaces/database";
import { QueryResult } from "./queryResult";
import { CommandError } from "../shared/errors/commandError";

/**
 * Execute a query on a database.
 * 
 * @param command Sqlite command to use to execute the query, it must be a valid sqlite command.
 * @param database Database to query.
 * @param query The query to execute.
 * 
 * @returns Promise that resolves to a `QueryResult` if the query worked or there was an error in the query,
 *          or that rejects with error `CommandError` if there was an error in the command passed as argument.
 */
export function executeQuery(command: string, database: Database, query: string): Promise<QueryResult> {
    if (!command) {
        return Promise.reject(new CommandError("SQLite command is not valid, unable to execute queries."));
    }

    logger.debug(`SQLite command: '${command}'`);
    logger.debug(`Database: ${database.path}`);

    // query preprocess (ATTACH dbs?)
    query = SQLParser.parse(query).join(' ');
    logger.info(`[QUERY] ${query}`);

    return spawnProcess(command, database.path, query);
}