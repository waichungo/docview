import { NativeObject } from "../models/models.js";
import sqlite3 from 'sqlite3'
export enum DBEQUALITY {
    EQUAL = 0,
    LESSTHAN,
    GREATERTHAN,
    LESSTHAN_OR_EQUAL,
    GREATERTHAN_OR_EQUAL,
    IN,
    NOT_IN,
    STARTS_WITH,
    ENDS_WITH,
    CONTAINS,
}
export enum DBQUERYTYPE { AND = 0, OR }
export abstract class Query {
    q: Query | null;
    type: DBQUERYTYPE;
    queries: QueryParam[];
    constructor(type: DBQUERYTYPE, q: Query | null = null, queries: any[] = []) {
        this.q = q;
        this.type = type
        this.queries = queries
    }
}
export class AndQuery extends Query {
    constructor(q: Query | null = null, queries: any[] = []) {
        super(DBQUERYTYPE.AND, q, queries)
    }
}
export class OrQuery extends Query {
    constructor(q: Query | null = null, queries: any[] = []) {
        super(DBQUERYTYPE.OR, q, queries)
    }
}

export class QueryParam {
    key: string;
    equality: DBEQUALITY;
    bindName: string | null;
    value: any;
    values: any[];
    constructor(key: string = "", equality: DBEQUALITY = DBEQUALITY.EQUAL, value: any = null, values: any[] = [], bindName: string | null = null) {
        this.key = key;
        this.equality = equality;
        this.bindName = bindName;
        this.value = value;
        this.values = values;
    }
}


export class DBIndexDescriptor {
    field: string;
    indexName: string;
    constructor(field: string = "", indexName: string = "") {
        this.field = field;
        this.indexName = indexName;
    }
}

export class ForeignField {
    keyType: string
    table: string
    field: string
    refTable: string
    refField: string
    isNullable: boolean

    constructor(keyType: string,
        table: string,
        field: string,
        refTable: string,
        refField: string,
        isNullable: boolean) {
        this.keyType = keyType;
        this.table = table;
        this.field = field;
        this.refTable = refTable;
        this.refField = refField;
        this.isNullable = isNullable
    }
}

export class DBField {
    name: string;
    type: string;
    isNullable: boolean;
    isPrimaryKey: boolean;

    constructor(
        name: string,
        isNullable: boolean,
        type: string,
        isPrimaryKey: boolean) {
        this.name = name;
        this.type = type;
        this.isNullable = isNullable;
        this.isPrimaryKey = isPrimaryKey
    }

}
export class DBCreateConfig {
    tableName: string;
    indexes: DBIndexDescriptor[]
    uniqueIndexes: DBIndexDescriptor[]
    fields: DBField[]
    foreignFields: ForeignField[]
    constructor(tableName: string = "", indexes: DBIndexDescriptor[] = [], uniqueIndexes: DBIndexDescriptor[] = [], fields: DBField[] = [], foreignFields: ForeignField[] = []) {
        this.tableName = tableName;
        this.indexes = indexes;
        this.uniqueIndexes = uniqueIndexes;
        this.fields = fields;
        this.foreignFields = []
    }
}
interface ArrMap {
    [key: string]: string[]
}
export class DBHelpers {
    static _typesMap: NativeObject = {
        "int": "INTEGER",
        "long": "INTEGER",
        "byte": "INTEGER",
        "short": "INTEGER",
        "bool": "INTEGER",
        "double": "REAL",
        "Uint8Array": "BLOB",
        "Date": "INTEGER",
        "string": "TEXT",
    };
    static getDBTypeFromType(type: string): string {
        var elements = type.split("|").filter(e => e.trim().length > 0 && e.trim() != "null").map(e => e.trim())
        if (this._typesMap[elements[0]]) {
            return this._typesMap[elements[0]]
        }
        return "";
    }

    static isQueryValid(q: Query | null): boolean {
        if (q != null) {
            if ((q.queries.length) == 0 && q.q == null) {
                return false
            }
            for (let queryElement of q.queries) {
                if ((queryElement.key == "") || (queryElement.values.length == 0 && (queryElement.equality == DBEQUALITY.IN || queryElement.equality == DBEQUALITY.NOT_IN))) {
                    return false
                }
            }
            if (q.q != null) {
                return DBHelpers.isQueryValid(q.q)
            } else {
                return true
            }
        } else {
            return true
        }
    }
    static generateForeignKeysSql(cfg: DBCreateConfig): string {
        var res = "";

        var sql = "";
        for (var item of cfg.foreignFields) {
            sql =
                `ALTER TABLE ${item.table} ADD COLUMN ${item.field} ${DBHelpers.getDBTypeFromType(item.keyType)} REFERENCES ${item.refTable}(${item.refField});`;
            res += `${sql}\n`;
        }
        return res;
    }

    static generateIndexSql(cfg: DBCreateConfig): string {
        var res = "";
        var indexes = cfg.indexes;
        var uIndexes = cfg.uniqueIndexes;
        if (indexes.length == 0 && uIndexes.length == 0) {
            return res;
        }
        let indexMap: ArrMap = {};
        var propKeys = cfg.fields.map((e) => e.name);
        for (var item of indexes) {
            if (!propKeys.includes(item.field)) {
                throw Error(
                    `'${item.field}' is not a valid index for '${cfg.tableName}' table`,
                );
            }
        }
        for (var item of uIndexes) {
            if (!propKeys.includes(item.field)) {
                throw Error(
                    `'${item.field}' is not a valid unique index for '${cfg.tableName}' table`,
                );
            }
        }

        for (var field of indexes) {
            if (field.indexName.length > 0) {
                if (!(indexMap[field.indexName])) {
                    indexMap[field.indexName] = [];
                }
                indexMap[field.indexName].push(field.field);
                continue;
            }
            res +=
                `CREATE INDEX IF NOT EXISTS "${cfg.tableName}_${field.field}_Idx" ON "${cfg.tableName}"(
                    "${field.field}"	ASC
                );
            `;
            res += "\n";
        }
        for (var key in indexMap) {
            var fieldsStr = indexMap[key].map((e) => `\"${e}\" ASC`).join(", ");
            res +=
                `CREATE INDEX IF NOT EXISTS "${cfg.tableName}_${key}_Idx" ON "${cfg.tableName}"(
                    ${fieldsStr}
                );
            `;
            res += "\n";
        }
        indexMap = {}
        for (var field of uIndexes) {
            if (field.indexName.length > 0) {
                if (!indexMap[field.indexName]) {
                    indexMap[field.indexName] = [];
                }
                indexMap[field.indexName].push(field.field);
                continue;
            }
            res += `CREATE UNIQUE INDEX IF NOT EXISTS "${cfg.tableName}_${field.field}_Idx" ON "${cfg.tableName}"(
                    "${field.field}"	ASC
                );
            `;
            res += "\n";
        }
        for (var key in indexMap) {
            var fieldsStr = indexMap[key].map((e) => `\"$e\" ASC`).join(", ");
            res +=
                `CREATE UNIQUE INDEX IF NOT EXISTS "${cfg.tableName}_${key}_Idx" ON "${cfg.tableName}"(
                    ${fieldsStr}
                );
            `;
            res += "\n";
        }

        return res;
    }

    static generateFieldsSql(cfg: DBCreateConfig): string {
        var res = "";
        var isNullable = true;
        let pKeys: DBField[] = [];
        for (var i = 0; i < cfg.fields.length; i++) {
            let prop: DBField = cfg.fields[i];
            if (prop.isPrimaryKey) {
                pKeys.push(prop);
            }
            var type = DBHelpers.getDBTypeFromType(prop.type);
            isNullable = prop.isNullable;

            res += `\t\"${prop.name}\" ${type}`;
            //"Id"	INTEGER NOT NULL,
            if (!isNullable) {
                res += " NOT NULL ";
            }
            if (i == cfg.fields.length - 1 && pKeys.length == 0) {
                res += "\n";
            } else {
                res += ",\n";
            }
        }
        if (pKeys.length > 0) {
            var keyStr = pKeys
                .map(
                    (e) =>
                        `\"${e.name}\" ${((e.type == "int" || e.type == "long") ? "AUTOINCREMENT" : "")}`,
                )
                .join(", ");
            res += `\tCONSTRAINT \"PK_${cfg.tableName}\" PRIMARY KEY( ${keyStr} )\n`;
        }
        return res;
    }

    static getTableSql(cfg: DBCreateConfig): string {
        var sql = "";
        var tableSql =
            `CREATE TABLE IF NOT EXISTS "${cfg.tableName}" (
                    ${DBHelpers.generateFieldsSql(cfg)}
                    );
                    `;
        var modelIndexSql = DBHelpers.generateIndexSql(cfg);
        var fKeysSql = "";
        if (cfg.foreignFields.length > 0) {
            fKeysSql = DBHelpers.generateForeignKeysSql(cfg).trim();
        }
        let sqls: string[] = [tableSql, modelIndexSql, fKeysSql];
        sql += sqls.map((e) => e.trim()).filter((e) => e.length > 0).join("\n");
        return sql;
    }

    static async createTableFromModel(
        conn: sqlite3.Database,
        cfg: DBCreateConfig,
    ): Promise<void> {
        var tableSql = DBHelpers.getTableSql(cfg);
        var modelIndexSql = DBHelpers.generateIndexSql(cfg);

        await conn.run(tableSql);
        if (modelIndexSql.length > 0)
            await conn.run(modelIndexSql);
    }

    static async createForeignKeys(
        conn: sqlite3.Database,
        cfg: DBCreateConfig,
    ): Promise<void> {
        if (cfg.foreignFields.length > 0) {
            var sql = DBHelpers.generateForeignKeysSql(cfg);
            try {
                await conn.run(sql);
            } catch (e) { }
        }
    }



    static queryToMap(queryParam: Query | null): NativeObject[] {
        let res: NativeObject[] = [];
        let q = queryParam;
        while (q != null) {
            if (q!.queries.length > 0) {
                for (var qParam of q.queries) {
                    if (qParam.value != null) {
                        var val = qParam.value;
                        if (qParam.equality == DBEQUALITY.STARTS_WITH) {
                            val = `${val}%`;
                        } else if (qParam.equality == DBEQUALITY.ENDS_WITH) {
                            val = `%${val}`;
                        } else if (qParam.equality == DBEQUALITY.CONTAINS) {
                            val = `%${val}%`;
                        }
                        let obj: NativeObject = {}
                        obj[qParam.key as string] = val as any;
                        res.push(obj);
                    } else if (qParam.values.length > 0) {
                        for (let i = 0; i < qParam.values.length; i++) {
                            var val = qParam.values[i];
                            let obj: NativeObject = {}
                            obj[qParam.key as string] = val as any;
                            res.push(obj);
                        }
                    }
                }
            }
            q = q!.q;
        }
        return res;
    }


    static getQueryLine(query: Query): string {
        let sqlSnippets: string[] = [];
        if (query.queries.length > 0) {
            for (var queryElement of query.queries) {
                var sql = "";
                var equality = "";
                if ((queryElement.key == "") ||
                    (queryElement.values.length == 0 &&
                        (queryElement.equality == DBEQUALITY.IN ||
                            queryElement.equality == DBEQUALITY.NOT_IN))) {
                    continue;
                }
                switch (queryElement.equality) {
                    case DBEQUALITY.EQUAL:
                        equality = "=";
                        break;
                    case DBEQUALITY.LESSTHAN:
                        equality = "<";
                        break;
                    case DBEQUALITY.GREATERTHAN:
                        equality = ">";
                        break;
                    case DBEQUALITY.LESSTHAN_OR_EQUAL:
                        equality = "<=";
                        break;
                    case DBEQUALITY.GREATERTHAN_OR_EQUAL:
                        equality = ">=";
                        break;
                    case DBEQUALITY.IN:
                        equality = "IN";
                        break;
                    case DBEQUALITY.NOT_IN:
                        equality = "NOT IN";
                        break;
                    case DBEQUALITY.STARTS_WITH:
                        equality = "LIKE";
                        break;
                    case DBEQUALITY.ENDS_WITH:
                        equality = "LIKE";
                        break;
                    case DBEQUALITY.CONTAINS:
                        equality = "LIKE";
                        break;
                }
                if ((queryElement.equality == DBEQUALITY.IN ||
                    queryElement.equality == DBEQUALITY.NOT_IN)) {
                    var vals = queryElement.values;
                    if (Object.prototype.toString.call(vals[0]) === "[object Date]" && !isNaN(vals[0])) {
                        for (let i = 0; i < vals.length; i++) {
                            vals[i] = (vals[i] as Date).getTime();
                        }
                    } else if (typeof (vals[0]) == "boolean") {
                        for (let i = 0; i < vals.length; i++) {
                            vals[i] = (vals[i] as boolean) ? 1 : 0;
                        }
                    }

                    var concat = queryElement.values
                        .map((e) => "?")
                        .join(", ");
                    var line = ` ${queryElement.key} ${equality} (${concat}) `;
                    sql += line;
                } else {
                    var val = queryElement.value;
                    if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val)) {
                        val = (val as Date).getTime();
                    } else if (typeof (val) == "boolean") {
                        val = (val as boolean) ? 1 : 0;
                    }
                    var append = "";
                    if (queryElement.equality == DBEQUALITY.STARTS_WITH) {
                        append = " COLLATE NOCASE ";
                    } else if (queryElement.equality == DBEQUALITY.ENDS_WITH) {
                        append = " COLLATE NOCASE ";
                    } else if (queryElement.equality == DBEQUALITY.CONTAINS) {
                        append = " COLLATE NOCASE ";
                    }
                    var line = ` ${queryElement.key} ${equality} ? ${append}`;
                    sql += line;
                }
                sqlSnippets.push(sql);
            }
        }
        if (query.q != null) {
            sqlSnippets.push(`( ${DBHelpers.getQueryLine(query.q!)} )`);
        }
        return sqlSnippets.join(((query.type == DBQUERYTYPE.AND) ? " AND " : " OR "));
    }
}
