import { ResultSet } from "../shared/interfaces/resultSet";
import { QueryError } from "../shared/errors/queryError";

export interface QueryResult {
    resultSet?: ResultSet;
    error?: QueryError;
}