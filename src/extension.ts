'use strict';

import { ExtensionContext, commands, Uri, TextDocument, workspace, window } from 'vscode';
import { showInputBox, createDocument, getEditorDocument, getEditorSelection, showErrorMessage } from './vscodewrapper';
import { logger } from './logging/logger';
import { getConfiguration, Configuration } from './configuration';
import { Constants } from './constants/constants';
import DatabaseStatusBar from './statusBar';
import Explorer from './explorer';
import ResultView from './resultview';
import LanguageServer from './languageserver';
import { executeQuery, retrieveSchema, DatabasePath } from './database';
import { validateSqliteCommand } from './utils/sqliteCommandValidation';
import { DatabaseSchema, TableSchema } from './database/interfaces/databaseSchema';
import { TypedMap } from './utils/typedMap';
import { pickListDatabase, pickWorkspaceDatabase } from './quickpick';

export namespace Commands {
    export const showOutputChannel = "sqlite.showOutputChannel";
    export const runDocumentQuery = "sqlite.runDocumentQuery";
    export const useDatabase: string = 'sqlite.useDatabase';
    export const explorerAdd: string = 'sqlite.explorer.add';
    export const explorerRemove: string = 'sqlite.explorer.remove';
    export const explorerRefresh: string = 'sqlite.explorer.refresh';
    export const newQuery: string = 'sqlite.newQuery';
    export const quickQuery: string = 'sqlite.quickQuery';
    export const runTableQuery: string = 'sqlite.runTableQuery';
    export const runSqliteMasterQuery: string = 'sqlite.runSqliteMasterQuery';
}

let configuration: Configuration;
let sqliteCommand: string; // sqlite command to use to execute queries
let documentDatabaseMap: TypedMap<Uri, DatabasePath>;
let databaseStatusBar: DatabaseStatusBar;
let explorer: Explorer<DatabaseSchema>;
let resultView: ResultView;
let languageserver: LanguageServer;

export function activate(context: ExtensionContext): Promise<boolean> {
    
    logger.info(`Activating extension ${Constants.extensionName} v${Constants.extensionVersion}...`);

    // TODO: maybe redo this part, not very clear and ugly

    // load configuration and validate sqlite command
    configuration = getConfiguration();
    try {
        sqliteCommand = validateSqliteCommand(configuration.sqlite3, context.extensionPath);
    } catch(e) {
        logger.error(e);
        showErrorMessage(e);
        sqliteCommand = "";
    }
    
    // reload configuration and validate sqlite command
    context.subscriptions.push(workspace.onDidChangeConfiguration(() => {
        configuration = getConfiguration();
        try {
            sqliteCommand = validateSqliteCommand(configuration.sqlite3, context.extensionPath);
        } catch(e) {
            logger.error(e);
            showErrorMessage(e);
            sqliteCommand = "";
        }
    }));

    // initialize modules
    documentDatabaseMap = new TypedMap<Uri, DatabasePath>();
    databaseStatusBar = new DatabaseStatusBar(Commands.useDatabase);
    explorer = new Explorer();
    resultView = new ResultView(context.extensionPath);
    languageserver = new LanguageServer();

    // TODO: redo this part
    /*
    languageserver.setSchemaHandler(doc => {
        let dbPath = sqlWorkspace.getDocumentDatabase(doc);
        if (dbPath) return retrieveSchema(sqliteCommand, {name: dbPath, main: dbPath});
        else return Promise.resolve();
    });
    */

    context.subscriptions.push(window.onDidChangeActiveTextEditor(updateDatabaseStatusBar));
    context.subscriptions.push(window.onDidChangeTextEditorViewColumn(updateDatabaseStatusBar));
    context.subscriptions.push(workspace.onDidOpenTextDocument(updateDatabaseStatusBar));
    context.subscriptions.push(workspace.onDidCloseTextDocument(updateDatabaseStatusBar));


    context.subscriptions.push(languageserver, databaseStatusBar, explorer, resultView);
    
    // register commands
    context.subscriptions.push(commands.registerCommand(Commands.showOutputChannel, () => {
        logger.showOutput();
    }));

    context.subscriptions.push(commands.registerCommand(Commands.runDocumentQuery, () => {
        return runDocumentQuery();
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.explorerAdd, (dbUri?: Uri) => {
        let dbPath = dbUri? DatabasePath.New(dbUri.fsPath) : dbUri;
        return explorerAdd(dbPath);
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.explorerRemove, (dbSchema?: DatabaseSchema) => {
        let dbName = dbSchema? dbSchema.name : undefined;
        return explorerRemove(dbName);
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.explorerRefresh, () => {
        return explorerRefresh();
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.useDatabase, () => {
        return useDatabase();
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.newQuery, (dbPath?: DatabasePath) => {
        return newQuery(dbPath);
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.quickQuery, () => {
        return quickQuery();
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.runTableQuery, (tableSchema: TableSchema) => {
        let dbSchema = tableSchema.parent;
        let dbPath = {name: dbSchema.name, path: dbSchema.path};
        return runTableQuery(dbPath, tableSchema.name);
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.runSqliteMasterQuery, (dbSchema: DatabaseSchema) => {
        let dbPath = {name: dbSchema.name, path: dbSchema.path};
        return runSqliteMasterQuery(dbPath);
    }));

    logger.info(`Extension activated.`);
    return Promise.resolve(true);
}

function updateDatabaseStatusBar() {
    let sqlDocument = getEditorDocument('sql');
    if (sqlDocument) {
        let dbPath = documentDatabaseMap.get(sqlDocument.uri);
        databaseStatusBar.show(dbPath.path, dbPath.name);
    } else {
        databaseStatusBar.hide();
    }
}


function runDocumentQuery() {
    let sqlDocument = getEditorDocument('sql');
    if (sqlDocument) {
        let dbPath = documentDatabaseMap.get(sqlDocument.uri);
        if (dbPath) {
            let selection = getEditorSelection();
            let query = sqlDocument.getText(selection);
            runQuery(dbPath, query, true);
        } else {
            useDatabase().then(dbPath => {
                if (dbPath) runDocumentQuery();
            });
        }
    }
}

function quickQuery() {
    pickWorkspaceDatabase([DatabasePath.Memory()], ["db", "db3", "sqlite", "sqlite3", "sdb", "s3db"]).then(dbItem => {
        let dbPath = DatabasePath.New(dbItem.path, dbItem.name);
        showInputBox(`Your query here (database: ${dbPath.name})`).then(query => {
            if (query) {
                runQuery(dbPath, query, true);
            }
        });
    });
}

function useDatabase(): Thenable<DatabasePath> {
    let sqlDocument = getEditorDocument('sql');
    return pickWorkspaceDatabase([DatabasePath.Memory()], ["db", "db3", "sqlite", "sqlite3", "sdb", "s3db"]).then(
        dbItem => {
            let dbPath = DatabasePath.New(dbItem.path, dbItem.name);
            if (sqlDocument) {
                documentDatabaseMap.set(sqlDocument.uri, dbPath);
                databaseStatusBar.show(dbPath.path, dbPath.name);
            }
            return dbPath;
        },
        rejected => {
            // No database picked
        }
    );
}

function explorerAdd(dbPath?: DatabasePath) {
    if (dbPath) {
        retrieveSchema(sqliteCommand, dbPath).then(dbSchema => {
            explorer.add(dbSchema);
        });
    } else {
        pickWorkspaceDatabase([], ["db", "db3", "sqlite", "sqlite3", "sdb", "s3db"]).then(
            dbItem => {
                let dbPath = DatabasePath.New(dbItem.path, dbItem.name);
                explorerAdd(dbPath);
            },
            rejected => {
                // No database picked
            }
        );
    }
}

function explorerRemove(dbName?: string) {
    if (dbName) {
        explorer.remove(dbName);
    } else {
        let dbList = explorer.list().map(db => ({name: db.name, path: ''}));
        
        pickListDatabase(dbList).then(
            dbItem => {
                explorerRemove(dbItem.name);
            },
            rejected => {
            // No database choosen
            }
        );
    }
}

function explorerRefresh() {
    let dbList = explorer.list();
    dbList.forEach(dbConfig => {
        retrieveSchema(configuration.sqlite3, dbConfig).then(dbSchema => {
            explorer.add(dbSchema);
        });
    });
}

function newQuery(dbPath?: DatabasePath): Thenable<TextDocument> {
    return createDocument('sql', true).then(sqlDocument => {
        if (dbPath) documentDatabaseMap.set(sqlDocument.uri, dbPath);
        return sqlDocument;
    });
}

function runTableQuery(dbPath: DatabasePath, tableName: string) {
    let query = `SELECT * FROM \`${tableName}\`;`;
    runQuery(dbPath, query, true);
}

function runSqliteMasterQuery(dbPath: DatabasePath) {
    let query = `SELECT * FROM sqlite_master;`;
    runQuery(dbPath, query, true);
}

function runQuery(dbPath: DatabasePath, query: string, display: boolean) {
    let resultSet = executeQuery(configuration.sqlite3, dbPath, query).then(({resultSet, error}) => {
        // log and show if there is any error
        if (error) {
            logger.error(error.message);
            showErrorMessage(error.message, {title: "Show output", command: Commands.showOutputChannel});
        }

        return resultSet;
    });

    if (display) {
        resultView.display(resultSet, configuration.recordsPerPage);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
    
}