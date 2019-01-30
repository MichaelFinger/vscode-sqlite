export class QueryError extends Error {
    constructor(message?: string) {
        super(message);
    
        // restore prototype chain
        const actualProto = new.target.prototype;
        Object.setPrototypeOf(this, actualProto);

    }
}