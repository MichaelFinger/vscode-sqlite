import { Writable } from "stream";
import { StreamParser } from "./streamParser";
import { QueryError } from "../errors/queryError";

export class ErrorStreamParser extends Writable implements StreamParser<QueryError> {
    private error?: string;
    
    constructor() {
        super();
    }

    _write(chunk: any, encoding: string, callback: (err?: Error) => void) {
        this.push(chunk.toString());
        callback();
    }

    push(chunk: string) {
        if (!this.error) {
            this.error = "";
        }
        this.error += chunk;
    }

    getResult() {
        return this.error? new QueryError(this.error) : undefined;
    }
}