import * as child_process from 'child_process';
import { ResultSetStreamParser } from './resultSetStreamParser';
import { StreamParser } from './streamParser';
import { ResultSet } from '../../shared/interfaces/resultSet';
import { ErrorStreamParser } from './errorStreamParser';
import { QueryResult } from '../queryResult';
import { QueryError } from '../../shared/errors/queryError';
import { CommandError } from '../../shared/errors/commandError';

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