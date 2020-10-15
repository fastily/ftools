const wpApiQueryDefaults = {
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
};

class JSWiki {
    /**
     * Constructor, creates a new Wiki object with the specified hostname.
     * @param {string} hostname The hostname of the Wiki to use
     */
    constructor(hostname = "en.wikipedia.org") {
        this.setHostname(hostname);
    }

    /**
     * Sets the hostname of the server to query.
     * @param {string} hostname Configures the JSWiki object to use this hostname in the URL 
     */
    setHostname(hostname) {
        this.hostname = hostname;
        this.apiEndpoint = `https://${this.hostname}/w/api.php`
    }

    /**
     * Lists all namespaces on enwp
     */
    async listNamespaces() {
        const response = await axios.get(this.apiEndpoint, {
            params: {
                ...wpApiQueryDefaults,
                meta: "siteinfo",
                siprop: "namespaces"
            }
        });

        const out = [{ name: "(article)", id: "0" }];

        for (const [k, v] of Object.entries(response.data.query.namespaces))
            if (v.id > 0)
                out.push({ name: v.name, id: k });

        return out;
    }


    /**
     * Gets the site matrix for wiki farm the Wiki represented by this JSWiki is part of.
     */
    async siteMatrix() {
        const response = await axios.get(this.apiEndpoint, {
            params: {
                ...wpApiQueryDefaults,
                action: "sitematrix",
            }
        });

        const out = new Set(["commons.wikimedia.org", "meta.wikimedia.org", "species.wikimedia.org", "test.wikipedia.org", "www.wikidata.org"]);
        for (const [k, v] of Object.entries(response.data.sitematrix))
            if (parseInt(k) && v.site)
                for (const e of v.site)
                    if (!e.closed)
                        out.add(new URL(e.url).hostname);

        return out;
    }

    /**
     * Performs a prop API query, loops until all elements have been retrieved.  Results are returned in a map keyed by title.
     * @param {Object} pl The parameter list to query Wikipedia with
     * @param {string} queryName The name of the query (e.g. "transcludedin", "pageprops").  This is also the key that results are returned under.
     * @param {any} titles The title(s) to query.  This can be an Array of string (multiple titles) or just a String (one title)
     * @param {function} fetchElement The method used to extract elements from individual JSON objects in the results array.
     */
    async propCont(pl, queryName, titles, fetchElement = e => e.title) {
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
                pl = { ...pl, ...cont };

            const response = await axios.get(this.apiEndpoint, { params: pl })
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
     * Gets the specified properties of one title, with the option to limit the total number of returned results and/or continuation queries.
     * @param {Object} pl The parameter list to query Wikipedia with.
     * @param {string} queryName The name of the query (e.g. "transcludedin", "pageprops").  This is also the key that results are returned under. 
     * @param {string} title The title to query.
     * @param {string} limitKey The name of the key used to specifiy the maximum number of elements to get via the API in one query.  Optional, set null to disable.
     * @param {Number} maxResults The maximum total number of results to return.  Optional, set -1 to get all possible results from the API.  Ignored if limitKey is null.
     * @param {function} fetchElement The method used to extract elements from individual JSON objects in the results array.
     */
    async singlePropCont(pl, queryName, title, limitKey = null, maxResults = -1, fetchElement = e => e.title) {
        pl = {
            prop: queryName,
            titles: title,
            ...wpApiQueryDefaults,
            ...pl
        };

        if (limitKey)
            pl[limitKey] = "max";

        const out = [];
        let cont;

        do {
            if (maxResults > 0)
                pl[limitKey] = "" + Math.min(maxResults - out.length, 500);

            if (cont)
                pl = { ...pl, ...cont };

            const response = await axios.get(this.apiEndpoint, { params: pl })
            const qr = response.data?.query?.pages?.[0]?.[queryName]?.map(fetchElement);

            if (qr)
                out.push(...qr);

            cont = response.data?.continue;
        } while (cont && !(maxResults > 0 && out.length >= maxResults));

        return out;
    }


    /**
     * Performs a list API query, loops until all elements have been retrieved.
     * @param {Object} pl The parameter list to query Wikipedia with
     * @param {string} queryName The name of the query (e.g. "categorymembers", "allimages").  This is also the key that results are returned under.
     * @param {function} fetchElement The method used to extract elements from individual JSON objects in the results array.
     */
    async listCont(pl, queryName, fetchElement = e => e.title) {
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

            const response = await axios.get(this.apiEndpoint, { params: pl })
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
    async categoryMembers(cat, selectedNS = []) {
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
    async userUploads(user) {
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
    async transclusions(title, selectedNS = []) {
        const pl = {
            tilimit: "max",
        };
        if (selectedNS.length)
            pl["tinamespace"] = selectedNS.join("|");

        return await this.propCont(pl, "transcludedin", title);
    }

    /**
     * Get revisions of a page.  Returns an empty list if the page does not exist.
     * @param {string} title The title to get revisions for
     * @param {Number} limit The maximum number of revisions to return.  Optional, set -1 to disable.
     * @param {boolean} olderFirst Set true to cause older revisions to be loaded first.  The default behavior is to load newer revisions first.
     */
    async revisions(title, limit = -1, olderFirst = false) {
        const pl = { "rvprop": "flags|comment|user|content|ids|timestamp" }

        if (olderFirst)
            pl["rvdir"] = "newer";

        return await this.singlePropCont(pl, "revisions", title, "rvlimit", limit, e => e);
    }
}

export default JSWiki;