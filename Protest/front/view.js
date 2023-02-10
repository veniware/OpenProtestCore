class View extends Window {
    constructor(params) {
        super();

        this.AddCssDependencies("view.css");

        this.content.style.overflowY = "scroll";
        this.content.style.containerType = "inline-size";

        this.bar = document.createElement("div");
        this.bar.className = "win-toolbar view-toolbar";
        this.content.appendChild(this.bar);

        this.scroll = document.createElement("div");
        this.scroll.className = "view-scroll";
        this.content.appendChild(this.scroll);

        this.attributes = document.createElement("div");
        this.attributes.className = "view-attributes-list view-attributes-freeze";
        this.scroll.appendChild(this.attributes);

        this.sortButton = this.AddToolbarButton("Order", "mono/sort.svg?light");
        this.sortButton.onclick = () => this.Sort();
        this.bar.appendChild(this.sortButton);

        this.initiatorButton = this.AddToolbarButton("Info", "mono/lamp.svg?light");
        this.initiatorButton.onclick = () => this.Info();
        this.bar.appendChild(this.initiatorButton);

        this.bar.appendChild(this.AddToolbarSeparator());

        const editButton = this.AddToolbarButton("Edit", "mono/edit.svg?light");
        editButton.onclick = () => this.Edit();
        this.bar.appendChild(editButton);

        const fetchButton = this.AddToolbarButton("Fetch", "mono/ball.svg?light");
        fetchButton.onclick = () => this.Fetch();
        this.bar.appendChild(fetchButton);

        const deleteButton = this.AddToolbarButton("Delete", "mono/delete.svg?light");
        deleteButton.onclick = () => this.Delete();
        this.bar.appendChild(deleteButton);
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
            name.setAttribute("aria-label", "Attribute name");
            name.setAttribute("readonly", true);
            newAttribute.appendChild(name);

            const value = document.createElement("input");
            value.type = "text";
            value.value = this.link[attr].v;
            value.setAttribute("aria-label", "Attribute value");
            value.setAttribute("readonly", true);
            newAttribute.appendChild(value);

            const initiator = document.createElement("div");
            initiator.textContent = `${this.link[attr].i} - ${this.link[attr].d}`;
            //initiator.textContent = this.link[attr].i;
            newAttribute.appendChild(initiator);

        }
    }

    Sort() {

    }

    Info() {
        if (this.attributes.classList.contains("view-attributes-withinfo")) {
            this.initiatorButton.style.borderBottom = "none";
            this.attributes.classList.remove("view-attributes-withinfo");
        } else {
            this.initiatorButton.style.borderBottom = "#c0c0c0 solid 2px";
            this.attributes.classList.add("view-attributes-withinfo");
        }
    }

    Edit() {
        for (let i = 0; i < this.bar.childNodes.length; i++) {
            this.bar.childNodes[i].style.display = "none";
        }

        const btnSave = document.createElement("input");
        btnSave.type = "button";
        btnSave.value = "Save";
        btnSave.style.margin = "6px";
        this.bar.appendChild(btnSave);

        const btnRevert = document.createElement("input");
        btnRevert.type = "button";
        btnRevert.value = "Revert";
        btnRevert.style.margin = "6px";
        this.bar.appendChild(btnRevert);

        const btnCancel = document.createElement("input");
        btnCancel.type = "button";
        btnCancel.value = "Cancel";
        btnCancel.style.margin = "6px";
        this.bar.appendChild(btnCancel);

        this.attributes.classList.remove("view-attributes-freeze");

        for (let i = 0; i < this.attributes.childNodes.length; i++) {
            if (this.attributes.childNodes[i].childNodes.length < 3) continue;
            this.attributes.childNodes[i].childNodes[0].removeAttribute("readonly");
            this.attributes.childNodes[i].childNodes[1].removeAttribute("readonly");
        }

        btnSave.onclick = () => {
            //TODO:
            btnCancel.onclick();
        };

        btnRevert.onclick = () => {};

        btnCancel.onclick = () => {
            this.bar.removeChild(btnSave);
            this.bar.removeChild(btnRevert);
            this.bar.removeChild(btnCancel);

            for (let i = 0; i < this.bar.childNodes.length; i++) {
                this.bar.childNodes[i].style.display = "initial";
            }

            this.attributes.classList.add("view-attributes-freeze");

            for (let i = 0; i < this.attributes.childNodes.length; i++) {
                if (this.attributes.childNodes[i].childNodes.length < 3) continue;
                this.attributes.childNodes[i].childNodes[0].setAttribute("readonly", "true");
                this.attributes.childNodes[i].childNodes[1].setAttribute("readonly", "true");
            }

        };
    }

    Fetch() {

    }

    Delete() {
        this.ConfirmBox("Are you sure you want to delete this entry?").addEventListener("click", ()=> {
            
        });
    }

}