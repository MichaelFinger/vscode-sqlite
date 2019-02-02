import { window, OutputChannel } from "vscode";
import { Constants } from "../constants/constants";

export enum Level {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    SILENT = "SILENT"
}

class Logger {

    private logLevel: string;
    private outputChannel: OutputChannel;

    constructor() {
        this.logLevel = Level.INFO;
        this.outputChannel = window.createOutputChannel(Constants.outputChannelName);
    }

    setLogLevel(logLevel: string) {
        this.logLevel = logLevel;
    }

    debug(msg: any) {
        this.log(`${msg.toString()}`, Level.DEBUG);
    }

    info(msg: any) {
        this.log(`${msg.toString()}`, Level.INFO);
    }

    warn(msg: any) {
        this.log(`${msg.toString()}`, Level.WARN);
    }

    error(msg: any) {
        this.log(`${msg.toString()}`, Level.ERROR);
    }

    output(msg: any) {
        this.outputChannel.appendLine(msg.toString());
    }

    showOutput() {
        this.outputChannel.show();
    }

    getOutputChannel(): OutputChannel {
        return this.outputChannel;
    }

    private log(msg: string, level: Level) {
        // only for testing
        if (process.env.TEST_LOG_LEVEL) {
            this.setLogLevel(process.env.TEST_LOG_LEVEL);
            if (!logLevelGreaterThan(level, this.logLevel as Level)) {
                level = Level.SILENT;
            }
        }
        
        const time = new Date().toLocaleTimeString();
        msg = `[${time}][${Constants.extensionName}][${level}] ${msg}`;
        switch(level) {
            case Level.ERROR: console.error(msg); break;
            case Level.WARN: console.warn(msg); break;
            case Level.INFO: console.info(msg); break;
            case Level.DEBUG: console.log(msg); break;
        }
        // log to output channel
        if (this.logLevel && logLevelGreaterThan(level, this.logLevel as Level)) {
            this.output(msg);
        }
    }
}

/**
 * Verify if log level l1 is greater than log level l2
 * DEBUG < INFO < WARN < ERROR < SILENT
 */
function logLevelGreaterThan(l1: Level, l2: Level) {
    switch(l2) {
        case Level.ERROR:
            return (l1 === Level.ERROR);
        case Level.WARN:
            return (l1 === Level.WARN || l1 === Level.ERROR);
        case Level.INFO:
            return (l1 === Level.INFO || l1 === Level.WARN || l1 === Level.ERROR);
        case Level.DEBUG:
            return true;
        case Level.SILENT:
            return false;
        default:
            return (l1 === Level.INFO || l1 === Level.WARN || l1 === Level.ERROR);
    }
}

export const logger: Logger = new Logger();