import JSWiki from "/jswiki.js";
import { defaultTargetWiki } from "/utils.js";

export const nsPicker = {
    props: ["value"],
    data() {
        return {
            content: this.value,
            nsFilter: []
        }
    },
    created() {
        new JSWiki(defaultTargetWiki()).listNamespaces().then(result => {
            this.nsFilter = result;
            Vue.nextTick(() => $('#nsFilterDropdown').selectpicker('refresh'));
        });
    },
    template: `
    <div class="form-group">
        <label for="nsFilterDropdown">Restrict results to these namespaces (optional)</label>
        <select class="form-control selectpicker" id="nsFilterDropdown" v-model="content" v-on:change="$emit('input', content)" multiple>
            <option v-for="e in nsFilter" :value="e.id" :key="e.name">{{e.name}}</option>
        </select>
    </div>`
};

export const targetWiki = {
    data() {
        return {
            content: defaultTargetWiki()
        }
    },
    template: `
    <div class="form-group">
        <label for="targetWikiField">Target Wiki</label>
        <input id="targetWikiField" class="form-control" v-model="content" disabled>
        <small class="text-muted form-text">configure your default wiki <a href="/settings.html">here</a></small>
    </div>`
};