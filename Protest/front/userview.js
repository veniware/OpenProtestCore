class UserView extends Window {
    constructor(params) {
        super();
        this.params = params ? params : { file: null };

        this.AddCssDependencies("view.css");

        this.SetTitle("TODO");
        this.SetIcon("/mono/user.svg");

        this.attributes = document.createElement("div");
        this.attributes.className = "view-attributes-list";
        this.content.appendChild(this.attributes);

        if (this.params.file) {
            this.InitializePreview();
        } else {
            //TODO: new
        }
    }

    InitializePreview() {
        this.attributes.innerHTML = "";

        const obj = LOADER.users.data[this.params.file];
        console.log(obj);
        for (const attr in obj) {
            const newAttribute = document.createElement("div");
            this.attributes.appendChild(newAttribute);

            const name = document.createElement("input");
            name.type = "text";
            name.value = attr;
            name.setAttribute("readonly", true);
            newAttribute.appendChild(name);

            const value = document.createElement("input");
            value.type = "text";
            value.value = obj[attr].v;
            value.setAttribute("readonly", true);
            newAttribute.appendChild(value);

        }

    }
}