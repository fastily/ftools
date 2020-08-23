/**
 * Gets the default target wiki from localstorage or returns "en.wikipedia.org" if not set.
 */
export function defaultTargetWiki() {
    return window.localStorage.getItem("targetWiki") || "en.wikipedia.org"
}
