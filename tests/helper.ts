import { join } from "path";
import sqlite3 = require('sqlite3');
import { unlinkSync } from "fs";

export interface FakeDatabase {name: string, path: string, tables: [{name: string, columns: [{name: string, type: string, notnull: boolean, pk: Number}]}]}
export const fakeDatabase: FakeDatabase = require("./fake_database.json");
fakeDatabase.name = "fake.db";
fakeDatabase.path = join(__dirname, fakeDatabase.name);

export function getMockCallWhereParamEquals<T>(mock: jest.MockContext<T>, paramIndex: number, value: any) {
    for(let i=0; i<mock.calls.length; i++) {
        let call = mock.calls[i];
        let param = call[paramIndex];
        if (param === value) {
            return call;
        }
    }
}

export function createFakeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database(fakeDatabase.path);
        db.serialize(function() {
            for(let i=0; i<fakeDatabase.tables.length; i++) {
                let table = fakeDatabase.tables[i];
                let stmt = `CREATE TABLE IF NOT EXISTS ${table.name}`;
                stmt += `(`;
                for(let j=0; j<table.columns.length; j++) {
                    let col = table.columns[j];
                    stmt += `${col.name} ${col.type} ${col.notnull? 'NOT NULL' : ''} ${col.pk>0? 'PRIMARY KEY' : ''}`;
                    if (j < table.columns.length-1) stmt += `,`;
                }
                stmt += `)`;
                db.run(stmt);
            }
        });
        db.close((err) => {
            if (err) reject();
            else resolve();
        });
    });
}

export function removeFakeDatabase(): Promise<void> {
    // remove testing database
    try {
        unlinkSync(fakeDatabase.path);
    } catch(err) {
        console.log("An error occured while trying to delete the database");
        return Promise.reject();
    }
    return Promise.resolve();
}