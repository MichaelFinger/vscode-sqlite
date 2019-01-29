import { ResultSet } from "./resultSet";
import { QueryError } from "../errors/queryError";

export interface QueryResult {
    resultSet?: ResultSet;
    error?: QueryError;
}