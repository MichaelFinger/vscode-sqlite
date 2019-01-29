import { Writable } from "stream";

export interface StreamParser<T> extends Writable {
    push: (chunk: string) => void;
    getResult: () => T|undefined;
}