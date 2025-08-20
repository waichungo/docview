var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export var DBEQUALITY;
(function (DBEQUALITY) {
    DBEQUALITY[DBEQUALITY["EQUAL"] = 0] = "EQUAL";
    DBEQUALITY[DBEQUALITY["LESSTHAN"] = 1] = "LESSTHAN";
    DBEQUALITY[DBEQUALITY["GREATERTHAN"] = 2] = "GREATERTHAN";
    DBEQUALITY[DBEQUALITY["LESSTHAN_OR_EQUAL"] = 3] = "LESSTHAN_OR_EQUAL";
    DBEQUALITY[DBEQUALITY["GREATERTHAN_OR_EQUAL"] = 4] = "GREATERTHAN_OR_EQUAL";
    DBEQUALITY[DBEQUALITY["IN"] = 5] = "IN";
    DBEQUALITY[DBEQUALITY["NOT_IN"] = 6] = "NOT_IN";
    DBEQUALITY[DBEQUALITY["STARTS_WITH"] = 7] = "STARTS_WITH";
    DBEQUALITY[DBEQUALITY["ENDS_WITH"] = 8] = "ENDS_WITH";
    DBEQUALITY[DBEQUALITY["CONTAINS"] = 9] = "CONTAINS";
})(DBEQUALITY || (DBEQUALITY = {}));
export var DBQUERYTYPE;
(function (DBQUERYTYPE) {
    DBQUERYTYPE[DBQUERYTYPE["AND"] = 0] = "AND";
    DBQUERYTYPE[DBQUERYTYPE["OR"] = 1] = "OR";
})(DBQUERYTYPE || (DBQUERYTYPE = {}));
export class Query {
    constructor(type, q = null, queries = []) {
        this.q = q;
        this.type = type;
        this.queries = queries;
    }
}
export class AndQuery extends Query {
    constructor(q = null, queries = []) {
        super(DBQUERYTYPE.AND, q, queries);
    }
}
export class OrQuery extends Query {
    constructor(q = null, queries = []) {
        super(DBQUERYTYPE.OR, q, queries);
    }
}
export class QueryParam {
    constructor(key = "", equality = DBEQUALITY.EQUAL, value = null, values = [], bindName = null) {
        this.key = key;
        this.equality = equality;
        this.bindName = bindName;
        this.value = value;
        this.values = values;
    }
}
export class DBIndexDescriptor {
    constructor(field = "", indexName = "") {
        this.field = field;
        this.indexName = indexName;
    }
}
export class ForeignField {
    constructor(keyType, table, field, refTable, refField, isNullable) {
        this.keyType = keyType;
        this.table = table;
        this.field = field;
        this.refTable = refTable;
        this.refField = refField;
        this.isNullable = isNullable;
    }
}
export class DBField {
    constructor(name, isNullable, type, isPrimaryKey) {
        this.name = name;
        this.type = type;
        this.isNullable = isNullable;
        this.isPrimaryKey = isPrimaryKey;
    }
}
export class DBCreateConfig {
    constructor(tableName = "", indexes = [], uniqueIndexes = [], fields = [], foreignFields = []) {
        this.tableName = tableName;
        this.indexes = indexes;
        this.uniqueIndexes = uniqueIndexes;
        this.fields = fields;
        this.foreignFields = [];
    }
}
export class DBHelpers {
    static getDBTypeFromType(type) {
        var elements = type.split("|").filter(e => e.trim().length > 0 && e.trim() != "null").map(e => e.trim());
        if (this._typesMap[elements[0]]) {
            return this._typesMap[elements[0]];
        }
        return "";
    }
    static isQueryValid(q) {
        if (q != null) {
            if ((q.queries.length) == 0 && q.q == null) {
                return false;
            }
            for (let queryElement of q.queries) {
                if ((queryElement.key == "") || (queryElement.values.length == 0 && (queryElement.equality == DBEQUALITY.IN || queryElement.equality == DBEQUALITY.NOT_IN))) {
                    return false;
                }
            }
            if (q.q != null) {
                return DBHelpers.isQueryValid(q.q);
            }
            else {
                return true;
            }
        }
        else {
            return true;
        }
    }
    static generateForeignKeysSql(cfg) {
        var res = "";
        var sql = "";
        for (var item of cfg.foreignFields) {
            sql =
                `ALTER TABLE ${item.table} ADD COLUMN ${item.field} ${DBHelpers.getDBTypeFromType(item.keyType)} REFERENCES ${item.refTable}(${item.refField});`;
            res += `${sql}\n`;
        }
        return res;
    }
    static generateIndexSql(cfg) {
        var res = "";
        var indexes = cfg.indexes;
        var uIndexes = cfg.uniqueIndexes;
        if (indexes.length == 0 && uIndexes.length == 0) {
            return res;
        }
        let indexMap = {};
        var propKeys = cfg.fields.map((e) => e.name);
        for (var item of indexes) {
            if (!propKeys.includes(item.field)) {
                throw Error(`'${item.field}' is not a valid index for '${cfg.tableName}' table`);
            }
        }
        for (var item of uIndexes) {
            if (!propKeys.includes(item.field)) {
                throw Error(`'${item.field}' is not a valid unique index for '${cfg.tableName}' table`);
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
        indexMap = {};
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
    static generateFieldsSql(cfg) {
        var res = "";
        var isNullable = true;
        let pKeys = [];
        for (var i = 0; i < cfg.fields.length; i++) {
            let prop = cfg.fields[i];
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
            }
            else {
                res += ",\n";
            }
        }
        if (pKeys.length > 0) {
            var keyStr = pKeys
                .map((e) => `\"${e.name}\" ${((e.type == "int" || e.type == "long") ? "AUTOINCREMENT" : "")}`)
                .join(", ");
            res += `\tCONSTRAINT \"PK_${cfg.tableName}\" PRIMARY KEY( ${keyStr} )\n`;
        }
        return res;
    }
    static getTableSql(cfg) {
        var sql = "";
        var tableSql = `CREATE TABLE IF NOT EXISTS "${cfg.tableName}" (
                    ${DBHelpers.generateFieldsSql(cfg)}
                    );
                    `;
        var modelIndexSql = DBHelpers.generateIndexSql(cfg);
        var fKeysSql = "";
        if (cfg.foreignFields.length > 0) {
            fKeysSql = DBHelpers.generateForeignKeysSql(cfg).trim();
        }
        let sqls = [tableSql, modelIndexSql, fKeysSql];
        sql += sqls.map((e) => e.trim()).filter((e) => e.length > 0).join("\n");
        return sql;
    }
    static createTableFromModel(conn, cfg) {
        return __awaiter(this, void 0, void 0, function* () {
            var tableSql = DBHelpers.getTableSql(cfg);
            var modelIndexSql = DBHelpers.generateIndexSql(cfg);
            yield conn.run(tableSql);
            if (modelIndexSql.length > 0)
                yield conn.run(modelIndexSql);
        });
    }
    static createForeignKeys(conn, cfg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (cfg.foreignFields.length > 0) {
                var sql = DBHelpers.generateForeignKeysSql(cfg);
                try {
                    yield conn.run(sql);
                }
                catch (e) { }
            }
        });
    }
    static queryToMap(queryParam) {
        let res = [];
        let q = queryParam;
        while (q != null) {
            if (q.queries.length > 0) {
                for (var qParam of q.queries) {
                    if (qParam.value != null) {
                        var val = qParam.value;
                        if (qParam.equality == DBEQUALITY.STARTS_WITH) {
                            val = `${val}%`;
                        }
                        else if (qParam.equality == DBEQUALITY.ENDS_WITH) {
                            val = `%${val}`;
                        }
                        else if (qParam.equality == DBEQUALITY.CONTAINS) {
                            val = `%${val}%`;
                        }
                        let obj = {};
                        obj[qParam.key] = val;
                        res.push(obj);
                    }
                    else if (qParam.values.length > 0) {
                        for (let i = 0; i < qParam.values.length; i++) {
                            var val = qParam.values[i];
                            let obj = {};
                            obj[qParam.key] = val;
                            res.push(obj);
                        }
                    }
                }
            }
            q = q.q;
        }
        return res;
    }
    static getQueryLine(query) {
        let sqlSnippets = [];
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
                            vals[i] = vals[i].getTime();
                        }
                    }
                    else if (typeof (vals[0]) == "boolean") {
                        for (let i = 0; i < vals.length; i++) {
                            vals[i] = vals[i] ? 1 : 0;
                        }
                    }
                    var concat = queryElement.values
                        .map((e) => "?")
                        .join(", ");
                    var line = ` ${queryElement.key} ${equality} (${concat}) `;
                    sql += line;
                }
                else {
                    var val = queryElement.value;
                    if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val)) {
                        val = val.getTime();
                    }
                    else if (typeof (val) == "boolean") {
                        val = val ? 1 : 0;
                    }
                    var append = "";
                    if (queryElement.equality == DBEQUALITY.STARTS_WITH) {
                        append = " COLLATE NOCASE ";
                    }
                    else if (queryElement.equality == DBEQUALITY.ENDS_WITH) {
                        append = " COLLATE NOCASE ";
                    }
                    else if (queryElement.equality == DBEQUALITY.CONTAINS) {
                        append = " COLLATE NOCASE ";
                    }
                    var line = ` ${queryElement.key} ${equality} ? ${append}`;
                    sql += line;
                }
                sqlSnippets.push(sql);
            }
        }
        if (query.q != null) {
            sqlSnippets.push(`( ${DBHelpers.getQueryLine(query.q)} )`);
        }
        return sqlSnippets.join(((query.type == DBQUERYTYPE.AND) ? " AND " : " OR "));
    }
}
DBHelpers._typesMap = {
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
//# sourceMappingURL=dbhelpers.js.map