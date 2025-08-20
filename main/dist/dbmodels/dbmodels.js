var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import p from "path";
import fs from "fs/promises";
import fs2 from "fs";
import os from "os";
import sqlite3 from "sqlite3";
import { AndQuery, DBCreateConfig, DBEQUALITY, DBField, DBHelpers, QueryParam } from "./dbhelpers.js";
import { timestampToDate, dateToTimeStamp, Document, DocumentFromJson } from "../models/models.js";
export function exists(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.access(path);
            return true;
        }
        catch (error) {
            console.error(error);
        }
        return false;
    });
}
function transact(db, cb) {
    db.serialize(() => {
        try {
            db.run('BEGIN TRANSACTION');
            cb(db);
            db.run('COMMIT');
            console.log('Transaction committed successfully.');
        }
        catch (err) {
            db.run('ROLLBACK');
            console.error('Transaction failed. Rolled back.', err);
        }
    });
}
export function getAppDirectory() {
    return __awaiter(this, void 0, void 0, function* () {
        let docDir = p.join(os.homedir(), "Documents");
        let path = p.join(docDir, "docview");
        if (!(yield exists(path))) {
            yield fs.mkdir(path, {
                recursive: true
            });
        }
        return path;
    });
}
export class DBAccess {
    static connection() { return DBAccess._conn; }
    ;
    static getDbSource() {
        return __awaiter(this, void 0, void 0, function* () {
            let path = p.join(yield getAppDirectory(), "db", 'docview.db');
            var dir = p.dirname(path);
            if (!(yield exists(dir))) {
                yield fs.mkdir(dir, {
                    recursive: true
                });
            }
            return path;
        });
    }
    static createModels() {
        return __awaiter(this, void 0, void 0, function* () {
            yield DocumentDBUtility.createDocumentsTable();
            let cfgs = [];
            cfgs.push(DocumentDBUtility.getDBConfig());
            for (let config of cfgs) {
                if (config.foreignFields.length > 0) {
                    yield DBHelpers.createForeignKeys(DBAccess.connection(), config);
                }
            }
        });
    }
    static initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (DBAccess._conn == null) {
                var path = yield DBAccess.getDbSource();
                DBAccess._conn = new sqlite3.Database(path, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
                yield DBAccess.createModels();
            }
        });
    }
}
export class DocumentDBUtility {
    static getDBConfig() {
        var cfg = new DBCreateConfig();
        cfg.tableName = DocumentDBUtility.table;
        cfg.fields.push(new DBField("path", false, "string", false));
        cfg.fields.push(new DBField("pages", false, "number", false));
        cfg.fields.push(new DBField("hash", false, "string", false));
        cfg.fields.push(new DBField("current_page", false, "number", false));
        cfg.fields.push(new DBField("type", false, "string", false));
        cfg.fields.push(new DBField("accessed", false, "string", false));
        cfg.fields.push(new DBField("id", false, "number", true));
        cfg.fields.push(new DBField("created_at", false, "Date", false));
        cfg.fields.push(new DBField("updated_at", false, "Date", false));
        return cfg;
    }
    static createDocumentsTable() {
        return __awaiter(this, void 0, void 0, function* () {
            var cfg = DocumentDBUtility.getDBConfig();
            yield DBHelpers.createTableFromModel(DBAccess.connection(), cfg);
        });
    }
    static importDocuments(json) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = 0;
            var list = JSON.parse(json).map((e) => DocumentFromJson(e));
            let keys = [...DocumentDBUtility.fields, DocumentDBUtility.idKey];
            keys = keys.filter((x) => !DocumentDBUtility.foreignFields.includes(x));
            if (DocumentDBUtility.primaryKeyType != "string") {
                keys = keys.filter((x) => x != DocumentDBUtility.idKey);
            }
            transact(DBAccess.connection(), function (db) {
                for (let model of list) {
                    let id = 0;
                    model.id = id;
                    var bindParams = {
                        "path": model.path,
                        "pages": model.pages,
                        "hash": model.hash,
                        "current_page": model.currentPage,
                        "type": model.type,
                        "accessed": model.accessed,
                        "created_at": dateToTimeStamp(model.createdAt),
                        "updated_at": dateToTimeStamp(model.updatedAt),
                    };
                    var bind2 = {};
                    let keys2 = [];
                    for (let key in bindParams) {
                        if (keys.includes(key)) {
                            bind2[key] = bindParams[key];
                            keys2.push(key);
                        }
                    }
                    var keysStr = keys2.join(" , ");
                    var valueStr = keys2.map((e) => "?").join(" , ");
                    var sql = `INSERT INTO ${DocumentDBUtility.table}(${keysStr}) VALUES(${valueStr});`;
                    let bindList = {};
                    for (let key in bind2) {
                        bindList[key] = bind2[key];
                        keys2.push(key);
                    }
                    try {
                        db.run(sql, bindList);
                        result++;
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            });
            return result;
        });
    }
    static exportDocuments(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let stream = fs2.createWriteStream(file);
            stream.write("[");
            let obj = null;
            var line = "";
            yield DocumentDBUtility.findDocuments(0, 0, "", true, null, (model) => {
                obj = model.toJson();
                let jsStr = JSON.stringify(obj, null, 4);
                line = jsStr.split("\n").map((e) => `\t${e}`).join("\n");
                stream.write(line);
                stream.write("\t,");
            }, null, null);
            stream.write("]");
        });
    }
    static createDocument(model, onError = null) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = null;
            let keys = [...DocumentDBUtility.fields];
            keys = keys.filter((x) => !DocumentDBUtility.foreignFields.includes(x));
            if (DocumentDBUtility.primaryKeyType != "string") {
                keys = keys.filter((x) => x != DocumentDBUtility.idKey);
            }
            let id = 0;
            ;
            model.id = id;
            model.createdAt = new Date();
            model.updatedAt = new Date();
            var bindParams = {
                "path": model.path,
                "pages": model.pages,
                "hash": model.hash,
                "current_page": model.currentPage,
                "type": model.type,
                "accessed": model.accessed,
                "created_at": dateToTimeStamp(model.createdAt),
                "updated_at": dateToTimeStamp(model.updatedAt),
            };
            var bind2 = {};
            let keys2 = [];
            for (let key in bindParams) {
                if (keys.includes(key)) {
                    bind2[key] = bindParams[key];
                    keys2.push(key);
                }
            }
            var keysStr = keys2.join(" , ");
            var valueStr = keys2.map((e) => "?").join(" , ");
            var sql = `INSERT INTO ${DocumentDBUtility.table}(${keysStr}) VALUES(${valueStr});`;
            let bindList = [];
            for (let key of keys2) {
                if (bind2[key]) {
                    bindList.push(bind2[key]);
                }
            }
            try {
                let insert = 0;
                DBAccess.connection().run(sql, bindList, function (err) {
                    if (err) {
                        return console.error(err.message);
                    }
                    insert = this.lastID;
                    id = this.lastID;
                });
                if (insert > 0) {
                    result = yield DocumentDBUtility.findDocument(id);
                    return result;
                }
                else {
                    if (onError != null) {
                        var err = "Failed to create document";
                        onError(err);
                    }
                }
            }
            catch (err) {
                console.error(err);
            }
            return result;
        });
    }
    static updateDocument(model) {
        return __awaiter(this, void 0, void 0, function* () {
            let keys = [...DocumentDBUtility.fields];
            keys = [...new Set(keys
                    .filter((x) => !DocumentDBUtility.foreignFields.includes(x) && x != DocumentDBUtility.idKey))];
            var bindParams = {
                "path": model.path,
                "pages": model.pages,
                "hash": model.hash,
                "current_page": model.currentPage,
                "type": model.type,
                "accessed": model.accessed,
                "created_at": dateToTimeStamp(model.createdAt),
                "updated_at": dateToTimeStamp(model.updatedAt),
            };
            var bind2 = {};
            let keys2 = [];
            for (let key in bindParams) {
                if (keys.includes(key)) {
                    bind2[key] = bindParams[key];
                    keys2.push(key);
                }
            }
            var valueStr = keys2.map((e) => `${e} = ?`).join(", ");
            var sql = `UPDATE ${DocumentDBUtility.table} SET ${valueStr}  WHERE ${DocumentDBUtility.idKey} =  ? ;
                `;
            let bindList = [];
            for (let key of keys2) {
                if (bind2[key]) {
                    bindList.push(bind2[key]);
                }
            }
            bindList.push(model.id);
            let updated = false;
            DBAccess.connection().run(sql, bindList, function (err) {
                if (err) {
                    return console.error(err.message);
                }
                else {
                    updated = this.changes > 0;
                }
            });
            if (updated) {
                return yield DocumentDBUtility.findDocument(model.id);
            }
            return null;
        });
    }
    static updateDocuments(models) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = 0;
            let keys = [...DocumentDBUtility.fields];
            keys = [...new Set(keys
                    .filter((x) => !DocumentDBUtility.foreignFields.includes(x) && x != DocumentDBUtility.idKey))];
            transact(DBAccess.connection(), function (db) {
                for (let model of models) {
                    var bindParams = {
                        "path": model.path,
                        "pages": model.pages,
                        "hash": model.hash,
                        "current_page": model.currentPage,
                        "type": model.type,
                        "accessed": model.accessed,
                        "created_at": dateToTimeStamp(model.createdAt),
                        "updated_at": dateToTimeStamp(model.updatedAt),
                    };
                    var bind2 = {};
                    let keys2 = [];
                    for (let key in bindParams) {
                        if (keys.includes(key)) {
                            bind2[key] = bindParams[key];
                            keys2.push(key);
                        }
                    }
                    var valueStr = keys2.map((e) => `${e} = ?`).join(", ");
                    var sql = `UPDATE ${DocumentDBUtility.table} SET ${valueStr}  WHERE ${DocumentDBUtility.idKey} =  ? ;
                `;
                    let bindList = [];
                    for (let key of keys2) {
                        if (bind2[key]) {
                            bindList.push(bind2[key]);
                        }
                    }
                    bindList.push(model.id);
                    let updated = false;
                    DBAccess.connection().run(sql, bindList, function (err) {
                        if (err) {
                            return console.error(err.message);
                        }
                        else {
                            updated = this.changes > 0;
                        }
                    });
                    if (updated) {
                        result++;
                    }
                }
            });
            return result;
        });
    }
    static findDocuments(limit = 0, page = 1, orderKey = "", orderDescending = true, queryParam = null, onDocument = null, loadfields, loadReferences) {
        return __awaiter(this, void 0, void 0, function* () {
            var result = {
                entries: [],
                page: page,
                total: 0,
                totalCount: 0,
                totalPages: 0,
            };
            if (queryParam != null) {
                if (!DBHelpers.isQueryValid(queryParam)) {
                    throw new Error(`Invalid query on 'findDocument' method`);
                }
            }
            let keys = loadfields != null ? [...loadfields] : [...DocumentDBUtility.fields];
            keys = keys.filter((x) => !DocumentDBUtility.foreignFields.includes(x));
            var loadKeysStr = keys.join(",");
            var sql = `SELECT ${loadKeysStr} FROM ${DocumentDBUtility.table} `;
            var conditions = "";
            if (queryParam != null &&
                (queryParam.q != null || queryParam.queries.length > 0)) {
                conditions = DBHelpers.getQueryLine(queryParam);
            }
            if (conditions.length > 0) {
                sql += ` where ${conditions} `;
            }
            if (orderKey.length > 0 &&
                (DocumentDBUtility.fields.includes(orderKey) || orderKey == DocumentDBUtility.idKey)) {
                sql += ` ORDER BY ${orderKey} ${orderDescending ? "DESC" : "ASC"} `;
            }
            else {
                sql += ` ORDER BY ${DocumentDBUtility.idKey} ${orderDescending ? "DESC" : "ASC"} `;
            }
            if (limit > 0) {
                if (page > 1) {
                    sql += ` limit ${page * limit},${limit} `;
                }
                else {
                    sql += ` limit ${limit} `;
                }
            }
            var flatParams = DBHelpers.queryToMap(queryParam);
            var flatParamsValues = flatParams.map((e) => e.value);
            DBAccess.connection().all(sql, flatParamsValues, function (err, rows) {
                var _a, _b;
                for (let row of rows) {
                    let model = new Document();
                    let entry = row;
                    model.path = entry["path"];
                    model.pages = entry["pages"];
                    model.hash = entry["hash"];
                    model.currentPage = entry["current_page"];
                    model.type = entry["type"];
                    model.accessed = entry["accessed"];
                    model.id = entry["id"];
                    model.createdAt = (_a = timestampToDate(entry["created_at"])) !== null && _a !== void 0 ? _a : new Date();
                    model.updatedAt = (_b = timestampToDate(entry["updated_at"])) !== null && _b !== void 0 ? _b : new Date();
                    result.entries.push(model);
                    if (onDocument) {
                        onDocument(model);
                    }
                }
            });
            if (conditions.length > 0 || limit > 0) {
                var countSql = `SELECT COUNT( ${DocumentDBUtility.idKey} ) as count FROM ${DocumentDBUtility.table} ${(conditions.length > 0 ? "where" : "")} ${conditions};`;
                let total = 0;
                DBAccess.connection().get(countSql, flatParamsValues, (err, row) => {
                    if (!err)
                        total = row["count"];
                });
                result.totalCount = total;
            }
            else {
                result.totalCount = result.entries.length;
            }
            result.total = result.entries.length;
            result.page = page;
            if (result.totalCount > 0 && limit > 0) {
                result.totalPages = Math.ceil(result.totalCount / limit);
            }
            return result;
        });
    }
    static findDocument(id, loadFields = null, loadReferences = null) {
        return __awaiter(this, void 0, void 0, function* () {
            var q = new QueryParam(DocumentDBUtility.idKey, DBEQUALITY.EQUAL, id);
            var res = yield DocumentDBUtility.findDocuments(1, 1, "", true, new AndQuery(null, [q]), null, loadFields, loadReferences = loadReferences);
            if (res.entries.length > 0) {
                return res.entries[0];
            }
            return null;
        });
    }
    static deleteDocument(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = false;
            var sql = `DELETE FROM ${DocumentDBUtility.table} WHERE ${DocumentDBUtility.idKey} = ? ;`;
            DBAccess.connection().run(sql, [id], function (err) {
                result = this.changes > 0;
            });
            return result;
        });
    }
    static deleteDocumentModel(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield DocumentDBUtility.deleteDocument(model.id);
        });
    }
    static deleteManyDocumentModels(models) {
        return __awaiter(this, void 0, void 0, function* () {
            if (models.length == 0)
                return 0;
            return DocumentDBUtility.deleteManyDocuments(models.map((e) => e.id));
        });
    }
    static deleteManyDocuments(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let affectedRows = 0;
            var sql = `DELETE FROM ${DocumentDBUtility.table} WHERE ${DocumentDBUtility.idKey} = ? ;`;
            transact(DBAccess.connection(), function (db) {
                var deleted = false;
                for (var id of ids) {
                    db.run(sql, [id], function (err) {
                        deleted = this.changes > 0;
                        if (deleted)
                            affectedRows++;
                    });
                }
            });
            return affectedRows;
        });
    }
}
DocumentDBUtility.table = "";
DocumentDBUtility.idKey = "id";
DocumentDBUtility.primaryKeyType = "string";
DocumentDBUtility.listSeparator = "::;;::";
DocumentDBUtility.mapKeySeparator = "<====>";
DocumentDBUtility.foreignFields = [];
DocumentDBUtility.fields = ["path", "pages", "hash", "current_page", "type", "accessed", "id", "created_at", "updated_at"];
//# sourceMappingURL=dbmodels.js.map