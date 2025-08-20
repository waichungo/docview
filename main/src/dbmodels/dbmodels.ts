import p from "path"
import fs from "fs/promises"
import fs2 from "fs"
import os from "os"
import sqlite3 from "sqlite3"
import { AndQuery, DBCreateConfig, DBEQUALITY, DBField, DBHelpers, DBIndexDescriptor, ForeignField, Query, QueryParam } from "./dbhelpers.js"
import { DBResult, NativeObject, timestampToDate, dateToTimeStamp, Document, DocumentFromJson } from "../models/models.js";
export async function exists(path: string): Promise<boolean> {
    try {
        await fs.access(path)
        return true
    } catch (error) {
        console.error(error)
    }
    return false
}
function transact(db: sqlite3.Database, cb: (db: sqlite3.Database) => void): void {
    db.serialize(() => {

        try {
            db.run('BEGIN TRANSACTION');
            cb(db)
            db.run('COMMIT');
            console.log('Transaction committed successfully.');
        } catch (err) {
            db.run('ROLLBACK');
            console.error('Transaction failed. Rolled back.', err);
        }
    });
}
export async function getAppDirectory(): Promise<string> {
    let docDir = p.join(os.homedir(), "Documents");
    let path = p.join(docDir, "docview");

    if (!await exists(path)) {
        await fs.mkdir(path, {
            recursive: true
        })
    }
    return path;
}

export class DBAccess {
    private static _conn: sqlite3.Database | null;
    static connection(): sqlite3.Database | null { return DBAccess._conn };
    static async getDbSource(): Promise<string> {
        let path = p.join(await getAppDirectory(), "db", 'docview.db');
        var dir = p.dirname(path);
        if (!await exists(dir)) {
            await fs.mkdir(dir, {
                recursive: true
            })
        }
        return path;
    }

    static async createModels(): Promise<void> {
        await DocumentDBUtility.createDocumentsTable();

        let cfgs: DBCreateConfig[] = [];
        cfgs.push(DocumentDBUtility.getDBConfig());

        for (let config of cfgs) {
            if (config.foreignFields.length > 0) {
                await DBHelpers.createForeignKeys(DBAccess.connection()!, config);
            }
        }
    }

    static async initialize(): Promise<void> {
        if (DBAccess._conn == null) {
            var path = await DBAccess.getDbSource();
            DBAccess._conn = new sqlite3.Database(path, (err) => {
                if (err) {
                    console.error(err)
                }
            })
            await DBAccess.createModels();
        }
    }
}


export class DocumentDBUtility {
    static readonly table: string = "";
    static readonly idKey: string = "id";
    static readonly primaryKeyType: string = "string";
    static readonly listSeparator: string = "::;;::";
    static readonly mapKeySeparator: string = "<====>"

    static readonly foreignFields: string[] = [];
    static readonly fields: string[] = ["path", "pages", "hash", "current_page", "type", "accessed", "id", "created_at", "updated_at"];


    static getDBConfig(): DBCreateConfig {
        var cfg = new DBCreateConfig();
        cfg.tableName = DocumentDBUtility.table;
        cfg.fields.push(
            new DBField(
                "path",
                false,
                "string",
                false,
            ),
        );
        cfg.fields.push(
            new DBField(
                "pages",
                false,
                "number",
                false,
            ),
        );
        cfg.fields.push(
            new DBField(
                "hash",
                false,
                "string",
                false,
            ),
        );
        cfg.fields.push(
            new DBField(
                "current_page",
                false,
                "number",
                false,
            ),
        );
        cfg.fields.push(
            new DBField(
                "type",
                false,
                "string",
                false,
            ),
        );
        cfg.fields.push(
            new DBField(
                "accessed",
                false,
                "string",
                false,
            ),
        );
        cfg.fields.push(
            new DBField(
                "id",
                false,
                "number",
                true,
            ),
        );
        cfg.fields.push(
            new DBField(
                "created_at",
                false,
                "Date",
                false,
            ),
        );
        cfg.fields.push(
            new DBField(
                "updated_at",
                false,
                "Date",
                false,
            ),
        );

        return cfg;
    }

    static async createDocumentsTable(): Promise<void> {
        var cfg = DocumentDBUtility.getDBConfig();
        await DBHelpers.createTableFromModel(DBAccess.connection()!, cfg);
    }

    static async importDocuments(json: string): Promise<number> {
        let result: number = 0;
        var list = (JSON.parse(json) as NativeObject[]).map((e) => DocumentFromJson(e));
        let keys: string[] = [...DocumentDBUtility.fields, DocumentDBUtility.idKey];
        keys = keys.filter((x) => !DocumentDBUtility.foreignFields.includes(x))
        if (DocumentDBUtility.primaryKeyType != "string") {
            keys = keys.filter((x) => x != DocumentDBUtility.idKey)
        }
        transact(DBAccess.connection()!, function (db: sqlite3.Database) {
            for (let model of list) {
                let id = 0;
                model.id = id;
                var bindParams: NativeObject = {
                    "path": model.path,
                    "pages": model.pages,
                    "hash": model.hash,
                    "current_page": model.currentPage,
                    "type": model.type,
                    "accessed": model.accessed,
                    "created_at": dateToTimeStamp(model.createdAt),
                    "updated_at": dateToTimeStamp(model.updatedAt),
                };
                var bind2: NativeObject = {}
                let keys2: string[] = []
                for (let key in bindParams) {
                    if (keys.includes(key)) {
                        bind2[key] = bindParams[key]
                        keys2.push(key)
                    }
                }

                var keysStr = keys2.join(" , ");
                var valueStr = keys2.map((e) => "?").join(" , ");
                var sql =
                    `INSERT INTO ${DocumentDBUtility.table}(${keysStr}) VALUES(${valueStr});`;
                let bindList: NativeObject = {}

                for (let key in bind2) {
                    bindList[key] = bind2[key]
                    keys2.push(key)
                }
                try {
                    db.run(sql, bindList);
                    result++;
                } catch (err) {
                    console.error(err)
                }

            }
        })
        return result;
    }

    static async exportDocuments(file: string): Promise<void> {
        let stream = fs2.createWriteStream(file)
        stream.write("[");
        let obj: any = null
        var line = "";
        await DocumentDBUtility.findDocuments(
            0, 0, "", true, null, (model) => {
                obj = model.toJson();
                let jsStr: string = JSON.stringify(obj, null, 4)
                line = jsStr.split("\n").map((e) => `\t${e}`).join("\n");
                stream.write(line);
                stream.write("\t,");
            }, null, null

        );
        stream.write("]");
    }

    static async createDocument(
        model: Document,
        onError: ((message: string) => void) | null = null,
    ): Promise<Document | null> {
        let result: Document | null = null;
        let keys: string[] = [...DocumentDBUtility.fields];
        keys = keys.filter((x) => !DocumentDBUtility.foreignFields.includes(x));
        if (DocumentDBUtility.primaryKeyType != "string") {
            keys = keys.filter((x) => x != DocumentDBUtility.idKey);
        }

        let id = 0;;
        model.id = id;
        model.createdAt = new Date()
        model.updatedAt = new Date()

        var bindParams: NativeObject = {
            "path": model.path,
            "pages": model.pages,
            "hash": model.hash,
            "current_page": model.currentPage,
            "type": model.type,
            "accessed": model.accessed,
            "created_at": dateToTimeStamp(model.createdAt),
            "updated_at": dateToTimeStamp(model.updatedAt),
        };


        var bind2: NativeObject = {}
        let keys2: string[] = []
        for (let key in bindParams) {
            if (keys.includes(key)) {
                bind2[key] = bindParams[key]
                keys2.push(key)
            }
        }

        var keysStr = keys2.join(" , ");
        var valueStr = keys2.map((e) => "?").join(" , ");
        var sql =
            `INSERT INTO ${DocumentDBUtility.table}(${keysStr}) VALUES(${valueStr});`;
        let bindList: any[] = []
        for (let key of keys2) {
            if (bind2[key]) {
                bindList.push(bind2[key])
            }
        }

        try {
            let insert: number = 0
            DBAccess.connection()!.run(sql, bindList, function (err) {
                if (err) {
                    return console.error(err.message);
                }
                insert = this.lastID;
                id = this.lastID
            });

            if (insert > 0) {
                result = await DocumentDBUtility.findDocument(id);
                return result;
            } else {
                if (onError != null) {
                    var err = "Failed to create document";
                    onError(err);
                }
            }

        } catch (err) {
            console.error(err)
        }
        return result;
    }

    static async updateDocument(model: Document): Promise<Document | null> {
        let keys: string[] = [...DocumentDBUtility.fields];
        keys = [...new Set(keys
            .filter((x) => !DocumentDBUtility.foreignFields.includes(x) && x != DocumentDBUtility.idKey)
        )]

        var bindParams: NativeObject = {
            "path": model.path,
            "pages": model.pages,
            "hash": model.hash,
            "current_page": model.currentPage,
            "type": model.type,
            "accessed": model.accessed,
            "created_at": dateToTimeStamp(model.createdAt),
            "updated_at": dateToTimeStamp(model.updatedAt),
        };
        var bind2: NativeObject = {}
        let keys2: string[] = []
        for (let key in bindParams) {
            if (keys.includes(key)) {
                bind2[key] = bindParams[key]
                keys2.push(key)
            }
        }

        var valueStr = keys2.map((e) => `${e} = ?`).join(", ");
        var sql =
            `UPDATE ${DocumentDBUtility.table} SET ${valueStr}  WHERE ${DocumentDBUtility.idKey} =  ? ;
                `;
        let bindList: any[] = []

        for (let key of keys2) {
            if (bind2[key]) {
                bindList.push(bind2[key])
            }
        }
        bindList.push(model.id);
        let updated = false
        DBAccess.connection()!.run(sql, bindList, function (err) {
            if (err) {
                return console.error(err.message);
            } else {
                updated = this.changes > 0
            }
        });
        if (updated) {
            return await DocumentDBUtility.findDocument(model.id)
        }
        return null;
    }
    static async updateDocuments(models: Document[]): Promise<number> {
        let result = 0
        let keys: string[] = [...DocumentDBUtility.fields];

        keys = [...new Set(keys
            .filter((x) => !DocumentDBUtility.foreignFields.includes(x) && x != DocumentDBUtility.idKey)
        )]

        transact(DBAccess.connection()!, function (db) {
            for (let model of models) {
                var bindParams: NativeObject = {
                    "path": model.path,
                    "pages": model.pages,
                    "hash": model.hash,
                    "current_page": model.currentPage,
                    "type": model.type,
                    "accessed": model.accessed,
                    "created_at": dateToTimeStamp(model.createdAt),
                    "updated_at": dateToTimeStamp(model.updatedAt),
                };
                var bind2: NativeObject = {}
                let keys2: string[] = []
                for (let key in bindParams) {
                    if (keys.includes(key)) {
                        bind2[key] = bindParams[key]
                        keys2.push(key)
                    }
                }

                var valueStr = keys2.map((e) => `${e} = ?`).join(", ");
                var sql =
                    `UPDATE ${DocumentDBUtility.table} SET ${valueStr}  WHERE ${DocumentDBUtility.idKey} =  ? ;
                `;
                let bindList: any[] = []

                for (let key of keys2) {
                    if (bind2[key]) {
                        bindList.push(bind2[key])
                    }
                }
                bindList.push(model.id);
                let updated = false
                DBAccess.connection()!.run(sql, bindList, function (err) {
                    if (err) {
                        return console.error(err.message);
                    } else {
                        updated = this.changes > 0
                    }
                });
                if (updated) {
                    result++
                }
            }
        })

        return result;
    }
    static async findDocuments(
        limit: number = 0,
        page: number = 1,
        orderKey: string = "",
        orderDescending: boolean = true,
        queryParam: Query | null = null,
        onDocument: ((model: Document) => void) | null = null,
        loadfields: string[] | null,
        loadReferences: string[] | null,
    ): Promise<DBResult<Document>> {
        var result: DBResult<Document> = {
            entries: [],
            page: page,
            total: 0,
            totalCount: 0,
            totalPages: 0,
        }
        if (queryParam != null) {
            if (!DBHelpers.isQueryValid(queryParam)) {
                throw new Error(`Invalid query on 'findDocument' method`)
            }
        }
        let keys: string[] = loadfields != null ? [...loadfields!] : [...DocumentDBUtility.fields];
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
        } else {
            sql += ` ORDER BY ${DocumentDBUtility.idKey} ${orderDescending ? "DESC" : "ASC"} `;
        }
        if (limit > 0) {
            if (page > 1) {
                sql += ` limit ${page * limit},${limit} `;
            } else {
                sql += ` limit ${limit} `;
            }
        }

        var flatParams = DBHelpers.queryToMap(queryParam);
        var flatParamsValues = flatParams.map((e) => e.value);
        DBAccess.connection()!.all(sql, flatParamsValues, function (err: Error | null, rows: any[]) {
            for (let row of rows) {
                let model = new Document();
                let entry: NativeObject = row
                model.path = (entry["path"] as string);
                model.pages = (entry["pages"] as number);
                model.hash = (entry["hash"] as string);
                model.currentPage = (entry["current_page"] as number);
                model.type = (entry["type"] as string);
                model.accessed = (entry["accessed"] as string);
                model.id = (entry["id"] as number);
                model.createdAt = timestampToDate(entry["created_at"] as number) ?? new Date();
                model.updatedAt = timestampToDate(entry["updated_at"] as number) ?? new Date();
                result.entries.push(model);
                if (onDocument) {
                    onDocument(model);
                }
            }
        });

        if (conditions.length > 0 || limit > 0) {
            var countSql =
                `SELECT COUNT( ${DocumentDBUtility.idKey} ) as count FROM ${DocumentDBUtility.table} ${(conditions.length > 0 ? "where" : "")} ${conditions};`;
            let total: number = 0
            DBAccess.connection()!.get(
                countSql,
                flatParamsValues,
                (err, row: NativeObject) => {
                    if (!err)
                        total = row["count"] as number
                }
            );
            result.totalCount = total;
        } else {
            result.totalCount = result.entries.length;
        }
        result.total = result.entries.length;

        result.page = page;
        if (result.totalCount > 0 && limit > 0) {
            result.totalPages = Math.ceil(result.totalCount / limit);
        }
        return result;
    }

    static async findDocument(
        id: number,
        loadFields: string[] | null = null,
        loadReferences: string[] | null = null
    ): Promise<Document | null> {
        var q = new QueryParam(DocumentDBUtility.idKey, DBEQUALITY.EQUAL, id);
        var res = await DocumentDBUtility.findDocuments(
            1, 1, "", true, new AndQuery(null, [q]), null, loadFields, loadReferences = loadReferences
        );
        if (res.entries.length > 0) {
            return res.entries[0]
        }
        return null;
    }

    static async deleteDocument(id: number): Promise<boolean> {
        let result = false;
        var sql = `DELETE FROM ${DocumentDBUtility.table} WHERE ${DocumentDBUtility.idKey} = ? ;`;
        DBAccess.connection()!.run(sql, [id], function (err) {
            result = this.changes > 0
        });
        return result;
    }
    static async deleteDocumentModel(model: Document): Promise<boolean> {
        return await DocumentDBUtility.deleteDocument(model.id);
    }


    static async deleteManyDocumentModels(models: Document[]): Promise<number> {
        if (models.length == 0) return 0;
        return DocumentDBUtility.deleteManyDocuments(models.map((e) => e.id));
    }
    static async deleteManyDocuments(ids: number[]): Promise<number> {

        let affectedRows = 0;

        var sql = `DELETE FROM ${DocumentDBUtility.table} WHERE ${DocumentDBUtility.idKey} = ? ;`;
        transact(DBAccess.connection()!, function (db) {
            var deleted = false;
            for (var id of ids) {
                db.run(sql, [id], function (err) {
                    deleted = this.changes > 0
                    if (deleted) affectedRows++
                });
            }
        })

        return affectedRows;
    }
}











