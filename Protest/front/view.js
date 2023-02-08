class View extends Window {
    constructor(params) {
        super();

        this.AddCssDependencies("view.css");

        this.content.style.overflowY = "scroll";

        this.attributes = document.createElement("div");
        this.attributes.className = "view-attributes-list";
        this.content.appendChild(this.attributes);

        this.AfterResize();
    }

    InitializePreview() {
        this.attributes.innerHTML = "";

        this.SetTitle(this.link.title.v ? this.link.title.v : "");

        for (const attr in this.link) {
            const newAttribute = document.createElement("div");
            this.attributes.appendChild(newAttribute);

            const name = document.createElement("input");
            name.type = "text";
            name.value = attr;
            name.setAttribute("readonly", true);
            newAttribute.appendChild(name);

            const value = document.createElement("input");
            value.type = "text";
            value.value = this.link[attr].v;
            value.setAttribute("readonly", true);
            newAttribute.appendChild(value);

            const initiator = document.createElement("div");
            initiator.textContent = `${this.link[attr].i} - ${this.link[attr].d}`;
            //initiator.textContent = this.link[attr].i;
            newAttribute.appendChild(initiator);

        }
    }

    AfterResize() { //override
        if (this.content.offsetWidth < 800) {
            this.attributes.style.left = "36px";
            this.attributes.style.right = "24px";

        } else {
            this.attributes.style.left = "200px";
            this.attributes.style.right = "24px";
        }
    }

}