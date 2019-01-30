import * as vscode from 'vscode';
import * as treeProvider from '../../src/explorer/explorerTreeProvider';
import Explorer from '../../src/explorer';
import { Constants } from '../../src/constants/constants';
import { SchemaDatabase } from '../../src/shared/interfaces/schema';
import { Database } from '../../src/shared/interfaces/database';

jest.mock("vscode");
jest.mock("../../src/explorer/explorerTreeProvider");

describe("schemaDatabaseExplorer.ts", () => {

    describe("SchemaDatabaseExplorer", () => {

        test("new should create the treeView with ExplorerTreeProvider as treeDataProvider", () => {
            const mockExplorerTreeProvider = {};
            (treeProvider.ExplorerTreeProvider as any) = jest.fn().mockImplementation(() => {
                return mockExplorerTreeProvider;
            });

            let explorer = new Explorer();

            expect(vscode.window.createTreeView).toBeCalledWith(Constants.sqliteExplorerViewId, {treeDataProvider: mockExplorerTreeProvider});
        });

        test("add should add to the tree the database object passed as argument", () => {
            const schemaDatabase: SchemaDatabase = {database: Database.New('fake_db'), tables: []};

            // TODO: rewrite to test that the database is added to the tree using the vscode api
            const mockExplorerTreeProvider = {addToTree: jest.fn()};
            (treeProvider.ExplorerTreeProvider as any) = jest.fn().mockImplementation(() => {
                return mockExplorerTreeProvider;
            });

            let explorer = new Explorer();
            explorer.add(schemaDatabase);

            expect(mockExplorerTreeProvider.addToTree).toBeCalledWith(schemaDatabase);
        });

        test("remove should remove from the tree the dbPath passed as argument", () => {
            const dbPath = "fake_dbPath";

            // TODO: rewrite to test that the database is added to the tree using the vscode api

            const mockExplorerTreeProvider = {removeFromTree: jest.fn()};
            (treeProvider.ExplorerTreeProvider as any) = jest.fn().mockImplementation(() => {
                return mockExplorerTreeProvider;
            });

            let explorer = new Explorer();
            explorer.remove(dbPath);

            expect(mockExplorerTreeProvider.removeFromTree).toBeCalledWith(dbPath);
        });
    });
});