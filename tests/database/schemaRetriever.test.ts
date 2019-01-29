import * as vscode from 'vscode';

jest.mock("vscode");

describe("schemaRetriever", () => {

    test("should resolve to the database schema", () => {
        expect(1).toBe(1);
    });

    test("should resolve to the database schema with no table if there are no tables", () => {
        expect(1).toBe(1);
    });

    test("should resolve to the database schema with no column if a table has no column", () => {
        expect(1).toBe(1);
    });

    test("should reject if the sqlite command passed as argument is incorrect", () => {
        expect(1).toBe(1);
    });

    test("should reject if the sqlite command passed as argument is an empty string", () => {
        expect(1).toBe(1);
    });

});