import * as assert from 'assert';
import { ResultSet } from '../database/resultSet';
import { ResultSetParser } from '../database/resultSetParser';

suite("ResultSetParser Tests", function () {

    test("should build resultset if chunks are valid", function() {
        let resultSetParser = new ResultSetParser();
        resultSetParser.push("SELECT * FROM company;\n\"h1\" \"h");
        resultSetParser.push("2\"\n\"r1\" \"r2\"\n");
        resultSetParser.push("\"r1\" \"r2\"\n");
        
        let expected = new ResultSet();
        expected.push({id: 0, stmt: "SELECT * FROM company;", header: ["h1", "h2"], rows: [["r1", "r2"], ["r1", "r2"]]});

        let actual = resultSetParser.done();
        
        assert.deepStrictEqual(actual, expected);
    });

    test("should build resultset on Windows if chunks are valid", function() {
        let resultSetParser = new ResultSetParser();
        resultSetParser.push("SELECT * FROM company;\r\n\"h1\" \"h");
        resultSetParser.push("2\"\r\n\"r1\" \"r2\"\r\n");
        resultSetParser.push("\"r1\" \"r2\"\r\n");
        
        let expected = new ResultSet();
        expected.push({id: 0, stmt: "SELECT * FROM company;", header: ["h1", "h2"], rows: [["r1", "r2"], ["r1", "r2"]]});

        let actual = resultSetParser.done();
        
        assert.deepStrictEqual(actual, expected);
    });
});