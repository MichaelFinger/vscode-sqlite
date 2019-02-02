import vscode = require('vscode');
import * as extension from "../src/extension";
import { Commands } from "../src/constants/commands";
import { Constants } from "../src/constants/constants";
import { createFakeDatabase, getMockCallWhereParamEquals, fakeDatabase, removeFakeDatabase, FakeDatabase } from './helper';
import { join, basename } from 'path';
import { logger } from '../src/logging/logger';

jest.mock('vscode');

describe('Extension tests', () => {

    beforeEach(() => {
        let context: any = {subscriptions: [], extensionPath: join(__dirname, "..")};
        return extension.activate(context).then(() => {
            logger.setSilent();

            return createFakeDatabase();
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        return removeFakeDatabase();
    });

    /**
     * Output Channel
     */
    test(`command ${Commands.showOutputChannel} should show the output channel`, () => {
        // the output channel should have been created with name Constants.outputChannelName
        expect(vscode.window.createOutputChannel).toHaveBeenCalledWith(Constants.outputChannelName);
        // retrieve the callback registered for the showOutputChannel command
        let showOutputChannelCallback = getRegisteredCommandCallback(Commands.showOutputChannel);

        // execute the command registered
        showOutputChannelCallback();

        // retrieve the created output channel
        let mockOutputChannel = (vscode.window.createOutputChannel as jest.Mock).mock.results[0].value;
        // make sure show has been called
        expect(mockOutputChannel.show).toHaveBeenCalled();
    });

    /**
     * Explorer
     */
    test(`command ${Commands.explorerAdd} should add the selected database to the explorer when executed from file context menu`, (done) => {

        // we retrieve the tree data provider created in activate() with name Constants.sqliteExplorerViewId
        let createTreeViewCall = getMockCallWhereParamEquals((vscode.window.createTreeView as jest.Mock).mock, 0, Constants.sqliteExplorerViewId);
        let treeDataProvider: vscode.TreeDataProvider<any> = createTreeViewCall[1].treeDataProvider;

        let explorerAddCallback = getRegisteredCommandCallback(Commands.explorerAdd);

        // executing a command from the context menu requires a uri, in our case we just need the system path of the file
        // this is the uri of the database we are trying to open
        let uri = {scheme: "file", fsPath: fakeDatabase.path};

        explorerAddCallback(uri).then(() => {
            return expectDatabaseAddedToTree(fakeDatabase, treeDataProvider);
        }).then(() => {
            done();
        });
    });

    test(`command ${Commands.explorerAdd} should add the database selected from the quickpick when executed from the command palette`, (done) => {
        let findFilesResolvedValues = [{scheme: "file", fsPath: fakeDatabase.path}, {scheme: "file", fsPath: join(__dirname, "other_file.db")}];
        (vscode.workspace.findFiles as any) = jest.fn().mockResolvedValue(findFilesResolvedValues);

        // we retrieve the tree data provider created in activate() with name Constants.sqliteExplorerViewId
        let createTreeViewCall = getMockCallWhereParamEquals((vscode.window.createTreeView as jest.Mock).mock, 0, Constants.sqliteExplorerViewId);
        let treeDataProvider: vscode.TreeDataProvider<any> = createTreeViewCall[1].treeDataProvider;

        let explorerAddCallback = getRegisteredCommandCallback(Commands.explorerAdd);

        (vscode.window.showQuickPick as any) = jest.fn().mockImplementation(() => {
            let quickPickItems: vscode.QuickPickItem[] = (vscode.window.showQuickPick as jest.Mock).mock.calls[0][0];

            // the quickpick should return the fake database
            let fakeDatabaseItem = quickPickItems.find(item => item.label === fakeDatabase.name && item.description === fakeDatabase.path);
            return Promise.resolve(fakeDatabaseItem);
        });
        
        // we are executing from the command palette so we dont pass any parameter
        explorerAddCallback().then(() => {
            // we check that the quickpick has been opened with options: the databases in the workspace, the :memory: database, and a file picker

            // we retrieve the items shown by the quickpick (we just need label and description)
            let quickPickItems: vscode.QuickPickItem[] = (vscode.window.showQuickPick as jest.Mock).mock.calls[0][0]
                                                            .map(item => ({label: item.label, description: item.description}));
            
            let expectedQuickPickItems: vscode.QuickPickItem[] = [];
            // workspace database files are first
            expectedQuickPickItems.push(...findFilesResolvedValues.map(file => ({label: basename(file.fsPath), description: file.fsPath}) ));
            // then :memory: database item
            expectedQuickPickItems.push({label: ":memory:", description: ':memory:'});
            // then 'Choose from file' item
            expectedQuickPickItems.push({label: "Choose database from file", description: ''});

            expect(quickPickItems).toEqual(expectedQuickPickItems);

            // we make sure the fake database is added to the explorer
            return expectDatabaseAddedToTree(fakeDatabase, treeDataProvider);
        }).then(() => {
            done();
        });
    });

    test(`command ${Commands.explorerAdd} should do nothing if no database is selected from the quickpick when executed from the command palette`, (done) => {
        let findFilesResolvedValues = [{scheme: "file", fsPath: fakeDatabase.path}, {scheme: "file", fsPath: join(__dirname, "other_file.db")}];
        (vscode.workspace.findFiles as any) = jest.fn().mockResolvedValue(findFilesResolvedValues);

        // we retrieve the tree data provider created in activate() with name Constants.sqliteExplorerViewId
        let createTreeViewCall = getMockCallWhereParamEquals((vscode.window.createTreeView as jest.Mock).mock, 0, Constants.sqliteExplorerViewId);
        let treeDataProvider: vscode.TreeDataProvider<any> = createTreeViewCall[1].treeDataProvider;

        let explorerAddCallback = getRegisteredCommandCallback(Commands.explorerAdd);

        // no item is selected
        (vscode.window.showQuickPick as any) = jest.fn().mockResolvedValue(undefined);

        explorerAddCallback().then(() => {
            // we check that the quickpick has been opened with options: the databases in the workspace, the :memory: database, and a file picker

            // we retrieve the items shown by the quickpick (we just need label and description)
            let quickPickItems: vscode.QuickPickItem[] = (vscode.window.showQuickPick as jest.Mock).mock.calls[0][0]
                                                            .map(item => ({label: item.label, description: item.description}));
            
            let expectedQuickPickItems: vscode.QuickPickItem[] = [];
            // workspace database files are first
            expectedQuickPickItems.push(...findFilesResolvedValues.map(file => ({label: basename(file.fsPath), description: file.fsPath}) ));
            // then :memory: database item
            expectedQuickPickItems.push({label: ":memory:", description: ':memory:'});
            // then 'Choose from file' item
            expectedQuickPickItems.push({label: "Choose database from file", description: ''});

            expect(quickPickItems).toEqual(expectedQuickPickItems);

            // we make sure the fake database is NOT added to the explorer
            return Promise.resolve(treeDataProvider.getChildren()).then((dbs: any[]) => {
                expect(dbs).toEqual([]);
            });
        }).then(() => {
            done();
        });
    });

    test(`command ${Commands.explorerRemove} should remove the selected database from the explorer when executed from the tree item context menu`, (done) => {
        // we retrieve the tree data provider created in activate() with name Constants.sqliteExplorerViewId
        let createTreeViewCall = getMockCallWhereParamEquals((vscode.window.createTreeView as jest.Mock).mock, 0, Constants.sqliteExplorerViewId);
        let treeDataProvider: vscode.TreeDataProvider<any> = createTreeViewCall[1].treeDataProvider;
        
        // this is the uri of the database we are opening
        let uri = {scheme: "file", fsPath: fakeDatabase.path};
        let explorerAddCallback = getRegisteredCommandCallback(Commands.explorerAdd);

        let explorerRemoveCallback = getRegisteredCommandCallback(Commands.explorerRemove);

        explorerAddCallback(uri).then(() => {
            return Promise.resolve(treeDataProvider.getChildren()).then(dbs => {
                // retrieve the first tree item of the explorer, it should be our fake database
                return dbs[0];
            });
        }).then((dbItem: vscode.TreeItem) => {
            // use the dbItem as param of explorer remove
            return explorerRemoveCallback(dbItem);
        }).then(() => {
            // make sure the explorer tree is now empty
            return Promise.resolve(treeDataProvider.getChildren()).then(dbs => {
                expect(dbs).toEqual([]);
            });
        }).then(() => {
            done();
        });

    });
});



function getRegisteredCommandCallback(command: string) {
    let call = getMockCallWhereParamEquals((vscode.commands.registerCommand as jest.Mock).mock, 0, command);
    return call[1];
}

function expectDatabaseAddedToTree(fakeDatabase: FakeDatabase, treeDataProvider: vscode.TreeDataProvider<any>): Promise<void> {
    // NOTE: promisify every ProviderResult so that they are easier to manage
    return Promise.resolve(treeDataProvider.getChildren()).then(dbs => {
        // the added database should be the first
        let db = dbs[0];
        expect(db).toBeDefined();

        return Promise.resolve(treeDataProvider.getTreeItem(db)).then(dbItem => {
            expect(dbItem.label).toBe(fakeDatabase.name);
            expect(dbItem.tooltip).toBe(fakeDatabase.path);

            // return the tables of the database
            return Promise.resolve(treeDataProvider.getChildren(db));
        });
    }).then((tables: any[]) => {
        // for each table we get the corresponding tree item and then we promisify everything
        return Promise.all(tables.map(table => Promise.resolve(treeDataProvider.getTreeItem(table)))).then(tableItems => {
            // make sure every table in the fake database has the corresponding table tree item
            // we check that the list of the labels of the table tree items includes the i-th table name
            for(let i=0; i<fakeDatabase.tables.length; i++) {
                let table = fakeDatabase.tables[i];
                expect(tableItems.map(item => item.label)).toContain(table.name);
            }
            
            // for each table we get its columns and then we promisify everything, the result is a list of lists
            return Promise.all(tables.map(table => Promise.resolve(treeDataProvider.getChildren(table))));
        });
    }).then((tablesColumns: any[][]) => {
        // we convert the the lists of columns to lists of column tree items and we promisify everything
        return Promise.all(tablesColumns.map(tableCols => Promise.all(tableCols.map(tableCol => Promise.resolve(treeDataProvider.getTreeItem(tableCol)))))).then(tablesColumnItems => {
            for(let i=0; i<tablesColumnItems.length; i++) {
                let table = fakeDatabase.tables[i];
                let tableColumnItems = tablesColumnItems[i];
                // make sure every column of the i-th table in the fake database has the corresponding column tree item
                // we check that the list of the labels of the columns of the i-th table tree item includes the j-th column name and type
                for(let j=0; j<table.columns.length; j++) {
                    let column = table.columns[j];
                    expect(tableColumnItems.map(item => item.label)).toContain(`${column.name} : ${column.type.toLowerCase()}`);
                    // TODO: test tooltip??
                }
            }
        });
    });
}