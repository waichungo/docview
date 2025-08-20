export function timestampToDate(data) {
    var result = null;
    if (typeof (data) == "number") {
        result = new Date(data);
    }
    else if (typeof (data) == "string") {
        try {
            var ms = Date.parse(data);
            if (!isNaN(ms)) {
                result = new Date(ms);
            }
        }
        catch (error) {
        }
    }
    else if (Object.prototype.toString.call(data) === "[object Date]" && !isNaN(data)) {
        result = data;
    }
    return result;
}
export function dateToTimeStamp(date) {
    var res = 0;
    if (date != null) {
        res = date.getTime();
    }
    return res;
}
export class Document {
    constructor() {
        this.path = "";
        this.pages = 0;
        this.hash = "";
        this.currentPage = 0;
        this.type = "";
        this.accessed = "";
        this.id = 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    toJson() {
        var res = {};
        let obj = {};
        res["path"] = this.path;
        res["pages"] = this.pages;
        res["hash"] = this.hash;
        res["currentPage"] = this.currentPage;
        res["type"] = this.type;
        res["accessed"] = this.accessed;
        res["id"] = this.id;
        res["createdAt"] = this.createdAt;
        res["updatedAt"] = this.updatedAt;
        return res;
    }
}
export function DocumentFromJson(json) {
    var _a, _b;
    var model = new Document();
    if (json["path"]) {
        model.path = json["path"];
    }
    if (json["pages"]) {
        model.pages = json["pages"];
    }
    if (json["hash"]) {
        model.hash = json["hash"];
    }
    if (json["currentPage"]) {
        model.currentPage = json["currentPage"];
    }
    if (json["type"]) {
        model.type = json["type"];
    }
    if (json["accessed"]) {
        model.accessed = json["accessed"];
    }
    if (json["id"]) {
        model.id = json["id"];
    }
    if (json["createdAt"]) {
        model.createdAt = (_a = timestampToDate(json["createdAt"])) !== null && _a !== void 0 ? _a : new Date();
    }
    if (json["updatedAt"]) {
        model.updatedAt = (_b = timestampToDate(json["updatedAt"])) !== null && _b !== void 0 ? _b : new Date();
    }
    return model;
}
//# sourceMappingURL=models.js.map