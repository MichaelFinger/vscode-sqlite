import * as vscode from 'vscode';

jest.mock("vscode");

describe("schemaRetriever", () => {

    test("should resolve to the database schema", () => {
        // TODO: implement
        expect(1).toBe(1);
    });

    test("should resolve to the database schema with no table if there are no tables", () => {
        // TODO: implement
        expect(1).toBe(1);
    });

    test("should resolve to the database schema with no column if a table has no column", () => {
        // TODO: implement
        expect(1).toBe(1);
    });

    test("should reject if the sqlite command passed as argument is incorrect", () => {
        // TODO: implement
        expect(1).toBe(1);
    });

    test("should reject if the sqlite command passed as argument is an empty string", () => {
        // TODO: implement
        expect(1).toBe(1);
    });

});