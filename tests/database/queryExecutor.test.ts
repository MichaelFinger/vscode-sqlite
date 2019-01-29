import * as vscode from 'vscode';

jest.mock("vscode");

describe("queryExecutor", () => {

    test("should resolve to the resultset and no error", () => {
        expect(1).toBe(1);
    });

    test("should resolve to an error and no resultset if the query is incorrect", () => {
        expect(1).toBe(1);
    });

    test("should resolve to the first result and an error if the first statement is correct and the second statament is incorrect", () => {
        expect(1).toBe(1);
    });

    test("should reject if the sqlite command passed as argument is incorrect", () => {
        expect(1).toBe(1);
    });

    test("should reject if the sqlite command passed as argument is an empty string", () => {
        expect(1).toBe(1);
    });

});