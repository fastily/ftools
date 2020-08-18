import JSWiki from "/jswiki.js";

const nsPicker = {
    props: ["value"],
    data() {
        return {
            content: this.value,
            nsFilter: []
        }
    },
    created() {
        JSWiki.listNamespaces().then(result => {
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

export { nsPicker }