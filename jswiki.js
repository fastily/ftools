const wpApiEndpoint = "https://en.wikipedia.org/w/api.php";

const wpApiQueryDefaults = {
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
};

class JSWiki {
    /**
     * Lists all namespaces on enwp
     */
    static async listNamespaces() {
        const response = await axios.get(wpApiEndpoint, {
            params: {
                ...wpApiQueryDefaults,
                meta: "siteinfo",
                siprop: "namespaces"
            }
        });

        const out = [{ name: "(article)", id: 0 }];

        for (const [k, v] of Object.entries(response.data.query.namespaces))
            if (v.id > 0)
                out.push({ name: v.name, id: k });

        return out;
    }

    /**
     * Performs a list API query, loops until all elements have been retrieved.
     * @param {Object} pl The parameter list to query Wikipedia with
     * @param {string} queryName The name of the query (e.g. "categorymembers", "allimages").  This is also the key that results are returned under.
     * @param {function} fetchElement The method used to extract elements from individual JSON objects in the results array.
     */
    static async listCont(pl, queryName, fetchElement) {
        const out = [];
        let cont = null
        do {
            if (cont)
                pl = {
                    ...pl,
                    ...cont
                };

            const response = await axios.get(wpApiEndpoint, { params: pl })
            for (const e of response.data.query[queryName])
                out.push(fetchElement(e));

            cont = "continue" in response.data ? response.data.continue : null;

        } while (cont)

        return out;
    }

    /**
     * List all pages in a category
     * @param {string} cat The category to list members of
     * @param {Array} selectedNS Optional - if set, then only pages in these namespaces will be returned (array of strings).
     */
    static async categoryMembers(cat, selectedNS = []) {
        let pl = {
            ...wpApiQueryDefaults,
            list: "categorymembers",
            cmlimit: "max",
            cmtitle: cat,
        }

        if (selectedNS.length)
            pl["cmnamespace"] = selectedNS.join("|");

        return await this.listCont(pl, "categorymembers", e => e.title);
    }

    /**
     * List all the uploads of a user
     * @param {string} user The username (wihtout User: prefix) to list uploads for
     */
    static async userUploads(user) {
        return await this.listCont({
            ...wpApiQueryDefaults,
            list: "allimages",
            aisort: "timestamp",
            ailimit: "max",
            aiuser: user,
        }, "allimages", e => e.title);
    }
}