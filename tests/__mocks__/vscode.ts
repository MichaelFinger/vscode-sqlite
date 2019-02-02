export const window = {
    createStatusBarItem: jest.fn().mockReturnValue({
        command: "command",
        tooltip: "tooltip",
        text: "text",
        show: jest.fn()
    }),
    activeTextEditor: jest.fn(),

    showQuickPick: jest.fn(),
    showErrorMessage: jest.fn(() => Promise.resolve()),

    onDidChangeActiveTextEditor: jest.fn(),
    onDidChangeTextEditorViewColumn: jest.fn(),

    createTreeView: jest.fn(),

    createOutputChannel: jest.fn().mockReturnValue({
        show: jest.fn(),
        appendLine: jest.fn()
    })
};

export const workspace = {
    findFiles: jest.fn(),
    onDidOpenTextDocument: jest.fn(),
    onDidCloseTextDocument: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    getConfiguration: jest.fn(() => ({get: jest.fn()}))
};

export const commands = {
    executeCommand: jest.fn(),
    registerCommand: jest.fn()
};

export const ExtensionContext = jest.fn();

export const Disposable = {
    from: jest.fn()
};

export const EventEmitter = jest.fn().mockImplementation(() => {
    return {
        event: {
            
        },
        fire: jest.fn()
    };
});

export const CancellationTokenSource = jest.fn().mockImplementation(() => {
    return {
        token: jest.fn(),
        cancel: jest.fn(),
        dispose: jest.fn()
    };
});

export const StatusBarAlignment = jest.fn();

export const TextDocument = jest.fn().mockImplementation(() => {
    return {
        uri: {toString: jest.fn()},
    };
});

export const TreeItem = jest.fn();

export const enum TreeItemCollapsibleState {
    None = 0,
    Collapsed = 1,
    Expanded = 2
}