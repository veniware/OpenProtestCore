class View extends Window {
	constructor(params) {
		super();
		
		this.AddCssDependencies("view.css");

		this.content.style.overflowY = "scroll";
		this.content.style.containerType = "inline-size";

		this.InitializeComponent();
	}

	InitializeComponent() {
		this.bar = document.createElement("div");
		this.bar.className = "win-toolbar view-toolbar";
		this.content.appendChild(this.bar);

		this.timeline = document.createElement("div");
		this.timeline.style.display = "none";
		this.timeline.className = "view-timeline";
		this.content.appendChild(this.timeline);

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

		this.timelineButton = this.AddToolbarButton("Timeline", "mono/timeline.svg?light");
		this.timelineButton.onclick = () => this.Timeline();
		this.bar.appendChild(this.timelineButton);

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

		this.SetupFloatingMenu();
		
	}

	AddAttribute(name, value, initiator, date, editMode=false) {
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

		const infoBox = document.createElement("div");
		newAttribute.appendChild(infoBox);

		let modDate = date ? new Date(UI.TicksToUnixDate(date)) : new Date();
		const dateBox = document.createElement("div");
		dateBox.textContent = `${modDate.toLocaleDateString(UI.regionalFormat, {})} ${modDate.toLocaleTimeString(UI.regionalFormat, {})}`;
		infoBox.appendChild(dateBox);

		let modInitiator = initiator ? initiator : KEEP.username;
		const initiatorBox = document.createElement("div");
		initiatorBox.textContent = modInitiator;
		infoBox.appendChild(initiatorBox);

		removeButton.onclick = ()=> {
			newAttribute.innerHTML = "";
			newAttribute.style.height = "0px";
			setTimeout(() =>{
				this.attributes.removeChild(newAttribute);
			}, 200);
		};
	}

	InitializePreview() {
		this.SetTitle(this.link.title ? this.link.title.v : "");
		this.InitializeAttributesList();
	}

	InitializeAttributesList() {
		this.attributes.innerHTML = "";

		for (const attr in this.link) {
			this.AddAttribute(attr, this.link[attr].v, this.link[attr].i, this.link[attr].d);
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

	async Timeline() { //overridable
		if (this.timeline.style.display !== "none") {
			this.timeline.style.display = "none";
			this.scroll.style.top = "48px";
			this.timelineButton.style.borderBottom = "none";
			return;
		}

		if (this.timeline.firstChild) this.timeline.removeChild(this.timeline.firstChild);

		const innerTimeline = document.createElement("div");
		this.timeline.appendChild(innerTimeline);

		this.timeline.style.display = "initial";
		this.scroll.style.top = "96px";
		this.timelineButton.style.borderBottom = "#c0c0c0 solid 2px";

		let json;
		try {
			const response = await fetch(`db/${this.timelineName}/timeline?file=${this.params.file}`, {
				method: "GET",
				cache: "no-cache",
				credentials: "same-origin"
			});

			if (response.status !== 200) throw(response.status);

			json = await response.json();
			if (json.error) throw(json.error);

		} catch (error) {
			console.error(error);
			return;
		}

		let sorted = [];

		sorted.push({
			time: Date.now(),
			obj: this.link
		});

		let min = Number.MAX_SAFE_INTEGER;
		let max = Date.now();

		for (const key in json) {
			let timestamp = UI.TicksToUnixDate(key);
			if (min > timestamp) min = timestamp;

			sorted.push({
				time: timestamp,
				obj: json[key]
			});
		}

		sorted.sort((a,b)=> b.time - a.time); //reversed


		let timeSpan = max - min;
		let lastStamp = Math.MAX_SAFE_INTEGER;
		let maxGap = { index:-1, length:0 };

		for (let i = 0; i < sorted.length; i++) {
			let x = (sorted[i].time - min) * 100 / timeSpan;

			if (lastStamp - x < 1.66) x = lastStamp - 1.66;

			const con = document.createElement("div");
			con.className = "timeline-con";
			con.style.left = `calc(${x}% - 5px)`;
			innerTimeline.appendChild(con);

			const dot = document.createElement("div");
			dot.className = "timeline-dot";
			con.appendChild(dot);
			
			sorted[i].x = x;
			sorted[i].con = con;

			let gap = lastStamp - x;
			if (maxGap.length < gap) maxGap = { index:i, length:gap };;
			lastStamp = x;

			con.onmouseenter = ()=> {
				this.floating.style.visibility = "visible";
				this.floating.style.opacity = "1";
				
				let left = this.content.offsetLeft + this.timeline.offsetLeft + con.offsetLeft - 72.5;
				if (left < 0) left = 0;
				if (left + 200 > this.content.offsetWidth) left = this.content.offsetWidth - 200;
				this.floating.style.left = `${left}px`;
				this.floating.style.top = `${this.content.offsetTop + this.timeline.offsetTop + 44}px`;

				let date = new Date(sorted[i].time);
				this.floating.textContent = `${date.toLocaleDateString(UI.regionalFormat, {})} ${date.toLocaleTimeString(UI.regionalFormat, {})}`;

			};

			con.onmouseleave = ()=> {
				this.floating.style.visibility = "hidden";
				this.floating.style.opacity = "0";
			};

			con.onclick = ()=> {
				console.log(sorted[i].time);
			};
		}

		//TODO: need a better way
		if (lastStamp < 0 && maxGap.length > 3) {
			let diff = Math.abs(lastStamp);
			if (diff > maxGap) diff = maxGap - 2;
			for (let i = maxGap.index; i < sorted.length; i++) {
				sorted[i].con.style.left = `calc(${sorted[i].x + diff}% - 5px)`;
			}
		}
	}

	Edit(isNew = false) { //overridable
		if (this.attributes.classList.contains("view-attributes-with-info")) {
			this.Info();
		}

		if (this.timeline.style.display !== "none") {
			this.Timeline();
		}

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
		if (isNew) btnRevert.disabled = "true";

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
			this.AddAttribute("", "", null, null, true);
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
			if (isNew) {
				this.Close();
			} else {
				Revert();
				ExitEdit();
			}
		};

		return btnSave;
	}

	Fetch() {} //overridable

	Delete() {} //overridable

}