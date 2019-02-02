'use strict';

import { ExtensionContext, commands, Uri, TextDocument, workspace, window } from 'vscode';
import { showInputBox, pickListDatabase, pickWorkspaceDatabase, createDocument,
         getEditorDocument, getEditorSelection, showErrorMessage, DatabaseStatusBarItem } from './vscodewrapper';
import { logger } from './logging/logger';
import { getConfiguration, Configuration } from './configuration';
import { Constants } from './constants/constants';
import DatabaseExploer from './explorer';
import ResultView from './resultview';
import LanguageServer from './languageserver';
import { executeQuery, retrieveSchema } from './database';
import { SchemaDatabase, SchemaTable } from './shared/interfaces/schema';
import { Database } from './shared/interfaces/database';
import { TypedMap } from './shared/utils/typedMap';
import { validateSqliteCommand } from './shared/utils/sqliteCommandValidation';
import { Commands } from './constants/commands';

let configuration: Configuration;
let sqliteCommand: string; // sqlite command to use to execute queries
let documentDatabaseMap: TypedMap<Uri, Database>;
let databaseStatusBarItem: DatabaseStatusBarItem;
let explorer: DatabaseExploer;
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
    documentDatabaseMap = new TypedMap<Uri, Database>();
    databaseStatusBarItem = new DatabaseStatusBarItem(Commands.useDatabase);
    explorer = new DatabaseExploer();
    resultView = new ResultView(context.extensionPath);
    //languageserver = new LanguageServer();

    // TODO: redo this part
    /*
    languageserver.setSchemaHandler(doc => {
        let database = sqlWorkspace.getDocumentDatabase(doc);
        if (database) return retrieveSchema(sqliteCommand, {name: database, main: database});
        else return Promise.resolve();
    });
    */

    context.subscriptions.push(languageserver, databaseStatusBarItem, explorer, resultView);

    context.subscriptions.push(window.onDidChangeActiveTextEditor(updateDatabaseStatusBar));
    context.subscriptions.push(window.onDidChangeTextEditorViewColumn(updateDatabaseStatusBar));
    context.subscriptions.push(workspace.onDidOpenTextDocument(updateDatabaseStatusBar));
    context.subscriptions.push(workspace.onDidCloseTextDocument(updateDatabaseStatusBar));
    
    // register commands
    context.subscriptions.push(commands.registerCommand(Commands.showOutputChannel, () => {
        logger.showOutput();
    }));

    context.subscriptions.push(commands.registerCommand(Commands.runDocumentQuery, () => {
        return runDocumentQuery();
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.explorerAdd, (dbUri?: Uri) => {
        let database = dbUri? Database.New(dbUri.fsPath) : dbUri;
        return explorerAdd(database);
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.explorerRemove, (schemaDatabase?: SchemaDatabase) => {
        let dbName = schemaDatabase? schemaDatabase.database.name : undefined;
        return explorerRemove(dbName);
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.explorerRefresh, () => {
        return explorerRefresh();
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.useDatabase, () => {
        return useDatabase();
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.newQuery, (database?: Database) => {
        return newQuery(database);
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.quickQuery, () => {
        return quickQuery();
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.runTableQuery, (schemaTable: SchemaTable) => {
        return runTableQuery(schemaTable.parent.database, schemaTable.name);
    }));
    
    context.subscriptions.push(commands.registerCommand(Commands.runSqliteMasterQuery, (schemaDatabase: SchemaDatabase) => {
        return runSqliteMasterQuery(schemaDatabase.database);
    }));

    logger.info(`Extension activated.`);
    return Promise.resolve(true);
}

function updateDatabaseStatusBar() {
    let sqlDocument = getEditorDocument('sql');
    if (sqlDocument) {
        let database = documentDatabaseMap.get(sqlDocument.uri);
        databaseStatusBarItem.show(database);
    } else {
        databaseStatusBarItem.hide();
    }
}


function runDocumentQuery() {
    let sqlDocument = getEditorDocument('sql');
    if (sqlDocument) {
        let database = documentDatabaseMap.get(sqlDocument.uri);
        if (database) {
            let selection = getEditorSelection();
            let query = sqlDocument.getText(selection);
            runQuery(database, query, true);
        } else {
            useDatabase().then(database => {
                if (database) runDocumentQuery();
            });
        }
    }
}

function quickQuery() {
    pickWorkspaceDatabase([], ["db", "db3", "sqlite", "sqlite3", "sdb", "s3db"], true).then(dbItem => {
        let database = Database.New(dbItem.path, dbItem.name);
        showInputBox(`Your query here (database: ${database.name})`).then(
            query => {
                runQuery(database, query, true);
            },
            rejected => {
                // No input
            }
        );
    });
}

function useDatabase(): Thenable<Database> {
    let sqlDocument = getEditorDocument('sql');
    return pickWorkspaceDatabase([], ["db", "db3", "sqlite", "sqlite3", "sdb", "s3db"], true).then(
        database => {
            if (sqlDocument) {
                documentDatabaseMap.set(sqlDocument.uri, database);
                databaseStatusBarItem.show(database);
            }
            return database;
        },
        rejected => {
            // No database picked
        }
    );
}

function explorerAdd(database?: Database): Thenable<void> {
    if (database) {
        return retrieveSchema(sqliteCommand, database).then(schemaDatabase => {
            explorer.add(schemaDatabase);
        });
    } else {
        return pickWorkspaceDatabase([], ["db", "db3", "sqlite", "sqlite3", "sdb", "s3db"], false).then(
            database => {
                return explorerAdd(database);
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
        let dbList = explorer.list().map(sdb => sdb.database);
        
        pickListDatabase(dbList).then(
            database => {
                explorerRemove(database.name);
            },
            rejected => {
            // No database choosen
            }
        );
    }
}

function explorerRefresh() {
    let sdbList = explorer.list();
    sdbList.forEach(schemaDatabase => {
        retrieveSchema(sqliteCommand, schemaDatabase.database).then(schemaDatabase => {
            explorer.add(schemaDatabase);
        });
    });
}

function newQuery(database?: Database): Thenable<TextDocument> {
    return createDocument('sql', true).then(sqlDocument => {
        if (database) {
            documentDatabaseMap.set(sqlDocument.uri, database);
        }
        return sqlDocument;
    });
}

function runTableQuery(database: Database, tableName: string) {
    let query = `SELECT * FROM \`${tableName}\`;`;
    runQuery(database, query, true);
}

function runSqliteMasterQuery(database: Database) {
    let query = `SELECT * FROM sqlite_master;`;
    runQuery(database, query, true);
}

function runQuery(database: Database, query: string, display: boolean) {
    let resultSet = executeQuery(sqliteCommand, database, query).then(({resultSet, error}) => {
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