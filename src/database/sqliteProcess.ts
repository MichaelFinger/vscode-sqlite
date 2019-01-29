import * as child_process from 'child_process';
import { ResultSetStreamParser } from './outputStreamParser.ts/resultSetStreamParser';
import { StreamParser } from './outputStreamParser.ts/streamParser';
import { ResultSet } from './interfaces/resultSet';
import { QueryError } from './errors/queryError';
import { ErrorStreamParser } from './outputStreamParser.ts/errorStreamParser';
import { CommandError } from './errors/commandError';
import { QueryResult } from './interfaces/queryResult';

/**
 * 
 * @param command 
 * @param dbPath 
 * @param query 
 */
export function spawnProcess(command: string, dbPath: string, query: string): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
        let errorParser: StreamParser<QueryError> = new ErrorStreamParser();
        let resultSetParser: StreamParser<ResultSet> = new ResultSetStreamParser();

        let args = [
            `${dbPath}`, `${query}`,
            `-header`, // print the headers before the result rows
            `-nullvalue`, `NULL`, // print NULL for null values
            `-echo`, // print the statement before the result
            `-cmd`, `.mode tcl`
        ];

        let proc = child_process.spawn(command, args, {stdio: ['ignore', "pipe", "pipe" ]});

        proc.once('error', (error) => {
            reject(new CommandError(error.message));
        });

        proc.stdout.pipe(resultSetParser);
        
        proc.stderr.pipe(errorParser);

        proc.once('close', () => {
            let resultSet = resultSetParser.getResult();
            let error = errorParser.getResult();
            resolve({resultSet, error});
        });
    });
}