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
     * Performs a prop API query, loops until all elements have been retrieved.  Results are returned in a map keyed by title.
     * @param {Object} pl The parameter list to query Wikipedia with
     * @param {string} queryName The name of the query (e.g. "transcludedin", "pageprops").  This is also the key that results are returned under.
     * @param {any} titles The title(s) to query.  This can be an Array of string (multiple titles) or just a String (one title)
     * @param {function} fetchElement The method used to extract elements from individual JSON objects in the results array.
     */
    static async propCont(pl, queryName, titles, fetchElement = e => e.title) {
        pl = {
            prop: queryName,
            titles: titles instanceof Array ? titles.join("|") : titles,
            ...wpApiQueryDefaults,
            ...pl
        };

        const out = new Map();
        let cont = null;
        do {
            if (cont)
                pl = {
                    ...pl,
                    ...cont
                };

            const response = await axios.get(wpApiEndpoint, { params: pl })
            for (const e of response.data.query.pages)
                if (queryName in e) {
                    const l = e[queryName].map(fetchElement)
                    out.set(e.title, out.has(e.title) ? out.get(e.title).concat(l) : l)
                }

            cont = "continue" in response.data ? response.data.continue : null;
        } while (cont)

        return out;
    }

    /**
     * Performs a list API query, loops until all elements have been retrieved.
     * @param {Object} pl The parameter list to query Wikipedia with
     * @param {string} queryName The name of the query (e.g. "categorymembers", "allimages").  This is also the key that results are returned under.
     * @param {function} fetchElement The method used to extract elements from individual JSON objects in the results array.
     */
    static async listCont(pl, queryName, fetchElement = e => e.title) {
        pl = {
            list: queryName,
            ...wpApiQueryDefaults,
            ...pl
        };

        const out = [];
        let cont = null;
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
        const pl = {
            cmlimit: "max",
            cmtitle: cat,
        };
        if (selectedNS.length)
            pl["cmnamespace"] = selectedNS.join("|");

        return await this.listCont(pl, "categorymembers");
    }

    /**
     * List all the uploads of a user
     * @param {string} user The username (wihtout User: prefix) to list uploads for
     */
    static async userUploads(user) {
        return await this.listCont({
            aisort: "timestamp",
            ailimit: "max",
            aiuser: user,
        }, "allimages");
    }

    /**
     * Get the list of pages transcluding a page/template
     * @param {string} title The title to fetch transclusions of
     * @param {Array} selectedNS Optional - if set, then only pages in these namespaces will be returned (array of strings).
     */
    static async transclusions(title, selectedNS = []) {
        const pl = {
            tilimit: "max",
        };
        if (selectedNS.length)
            pl["tinamespace"] = selectedNS.join("|");

        return await this.propCont(pl, "transcludedin", title);
    }
}

export default JSWiki;