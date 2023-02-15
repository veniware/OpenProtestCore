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

	AddAttribute(name, value, initiator, editMode=false) {
		const newAttribute = document.createElement("div");
		this.attributes.appendChild(newAttribute);

		const nameBox = document.createElement("input");
		nameBox.type = "text";
		nameBox.value = name;
		nameBox.setAttribute("aria-label", "Attribute name");
		if (!editMode) nameBox.setAttribute("readonly", "true");
		newAttribute.appendChild(nameBox);

		const valueBox = document.createElement("input");
		valueBox.type = "text";
		valueBox.value = value;
		valueBox.setAttribute("aria-label", "Attribute value");
		if (!editMode) valueBox.setAttribute("readonly", "true");
		newAttribute.appendChild(valueBox);

		const removeButton = document.createElement("input");
		removeButton.type = "button";
		removeButton.tabIndex = "-1";
		removeButton.setAttribute("aria-label", "Remove attribute");
		newAttribute.appendChild(removeButton);

		const initiatorBox = document.createElement("div");
		initiatorBox.textContent = initiator;
		newAttribute.appendChild(initiatorBox);

		removeButton.onclick = ()=> {
			newAttribute.innerHTML = "";
			newAttribute.style.height = "0px";
			setTimeout(() =>{
				this.attributes.removeChild(newAttribute);
			}, 200);
		};
	}

	InitializePreview() {
		this.SetTitle(this.link.title.v ? this.link.title.v : "");
		this.InitializeAttributesList();
	}

	InitializeAttributesList() {
		this.attributes.innerHTML = "";

		for (const attr in this.link) {
			this.AddAttribute(attr, this.link[attr].v, `${this.link[attr].i} - ${this.link[attr].d}`)
		}
	}

	Sort() {

	}

	Info() {
		if (this.attributes.classList.contains("view-attributes-with-info")) {
			this.initiatorButton.style.borderBottom = "none";
			this.attributes.classList.remove("view-attributes-with-info");
		} else {
			this.initiatorButton.style.borderBottom = "#c0c0c0 solid 2px";
			this.attributes.classList.add("view-attributes-with-info");
		}
	}

	Edit() { //overridable
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

		const addAttribute = document.createElement("div");
		addAttribute.style.textAlign = "center";
		this.scroll.appendChild(addAttribute);

		const addAttributeButton = document.createElement("input");
		addAttributeButton.type = "button";
		addAttributeButton.value = "Add attribute";
		addAttributeButton.style.marginTop = "24px";
		addAttributeButton.style.width = "128px";
		addAttributeButton.style.maxWidth = "150px";
		addAttributeButton.style.height = "38px";
		addAttribute.appendChild(addAttributeButton);

		this.attributes.classList.remove("view-attributes-freeze");

		for (let i = 0; i < this.attributes.childNodes.length; i++) {
			if (this.attributes.childNodes[i].childNodes.length < 3) continue;
			this.attributes.childNodes[i].childNodes[0].removeAttribute("readonly");
			this.attributes.childNodes[i].childNodes[1].removeAttribute("readonly");
		}

		addAttributeButton.onclick = ()=> {
			this.AddAttribute("", "", null, true);
		};

		const ExitEdit = ()=> {
			this.bar.removeChild(btnSave);
			this.bar.removeChild(btnRevert);
			this.bar.removeChild(btnCancel);

			for (let i = 0; i < this.bar.childNodes.length; i++) {
				this.bar.childNodes[i].style.display = "initial";
			}

			this.scroll.removeChild(addAttribute);

			this.attributes.classList.add("view-attributes-freeze");

			for (let i = 0; i < this.attributes.childNodes.length; i++) {
				if (this.attributes.childNodes[i].childNodes.length < 3) continue;
				this.attributes.childNodes[i].childNodes[0].setAttribute("readonly", "true");
				this.attributes.childNodes[i].childNodes[1].setAttribute("readonly", "true");
			}
		};

		const Revert = ()=> {
			this.InitializeAttributesList();
			for (let i = 0; i < this.attributes.childNodes.length; i++) {
				if (this.attributes.childNodes[i].childNodes.length < 3) continue;
				this.attributes.childNodes[i].childNodes[0].removeAttribute("readonly");
				this.attributes.childNodes[i].childNodes[1].removeAttribute("readonly");
			}
		};

		btnSave.onclick = () => {
			//TODO:
			ExitEdit();
		};

		btnRevert.onclick = () => {
			Revert();
		};

		btnCancel.onclick = () => {
			Revert();
			ExitEdit();
		};

		return btnSave;
	}

	Fetch() {} //overridable

	Delete() {} //overridable

}