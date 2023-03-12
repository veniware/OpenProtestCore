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

		this.infoButton = this.AddToolbarButton("Info", "mono/lamp.svg?light");
		this.infoButton.onclick = () => this.Info();
		this.bar.appendChild(this.infoButton);

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
		
		const copyButton = this.AddToolbarButton("Copy", "mono/copy.svg?light");
		copyButton.onclick = () => this.Copy();
		this.bar.appendChild(copyButton);

		const deleteButton = this.AddToolbarButton("Delete", "mono/delete.svg?light");
		deleteButton.onclick = () => this.Delete();
		this.bar.appendChild(deleteButton);

		this.SetupFloatingMenu();
	}

	CreateAttribute(name, value, initiator, date, editMode=false) {
		const newAttribute = document.createElement("div");
		//this.attributes.appendChild(newAttribute);

		const nameBox = document.createElement("input");
		nameBox.type = "text";
		nameBox.value = name;
		nameBox.setAttribute("aria-label", "Attribute name");
		if (!editMode) nameBox.setAttribute("readonly", "true");
		newAttribute.appendChild(nameBox);

		const valueContainer = document.createElement("div");
		newAttribute.appendChild(valueContainer);

		const valueBox = document.createElement("input");
		valueBox.type = "text";
		valueBox.value = value;
		valueBox.setAttribute("aria-label", "Attribute value");
		if (!editMode) valueBox.setAttribute("readonly", "true");
		valueContainer.appendChild(valueBox);

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
			setTimeout(() =>{ this.attributes.removeChild(newAttribute); }, 200);
		};

		if (value.indexOf(";") > -1) {
			valueBox.style.display = "none";

			let split = value.split(";");
			for (let i = 0; i < split.length; i++) {
				split[i] = split[i].trim();
				if (split[i].length === 0) continue;

				const newBox = document.createElement("div");
				newBox.textContent = split[i];
				valueContainer.appendChild(newBox);
			}
		}
		
		if (name.toLowerCase().indexOf("password") > -1) {
			valueBox.value = "";
			valueBox.style.display = "none";

			const btnShow = document.createElement("input");
			btnShow.type = "button";
			btnShow.value = "Show";

			const btnStamp = document.createElement("input");
			btnStamp.type = "button";
			btnStamp.style.minWidth = "40px";
			btnStamp.style.height = "32px";
			btnStamp.style.backgroundImage = "url(mono/stamp.svg?light)";
			btnStamp.style.backgroundSize = "28px 28px";
			btnStamp.style.backgroundPosition = "center center";
			btnStamp.style.backgroundRepeat = "no-repeat";

			valueContainer.append(btnShow, btnStamp);

			btnShow.onclick = ()=> {
				//TODO:
			};

			btnStamp.onclick = ()=> {
				//TODO:
			};
		}

		return newAttribute;
	}

	CreateGroupTitle(icon, title) {
		const newGroup = document.createElement("div");
		newGroup.className = "view-attributes-group";
		//this.attributes.appendChild(newGroup);

		newGroup.style.backgroundImage = `url(${icon})`;
		newGroup.textContent = title;

		return newGroup;
	}

	InitializePreview() {
		this.SetTitle(this.link.title ? this.link.title.v : "");
		this.InitializeAttributesList(this.link);
	}

	InitializeAttributesList(hash, editMode=false) {
		this.attributes.innerHTML = "";

		if (this.order === "group") {
			let pushed = [];
			let nextGroup = null;
			for (let i = 0; i < this.groupSchema.length; i++) {
				if (Array.isArray(this.groupSchema[i])) {
					if (!editMode) {
						nextGroup = this.CreateGroupTitle(this.groupSchema[i][0], this.groupSchema[i][1]);
					}
				} else {
					if (!hash.hasOwnProperty(this.groupSchema[i])) continue;

					if (nextGroup) {
						this.attributes.appendChild(nextGroup);
						nextGroup = null;
					}

					this.attributes.appendChild(
						this.CreateAttribute(
							this.groupSchema[i],
							hash[this.groupSchema[i]].v,
							hash[this.groupSchema[i]].i,
							hash[this.groupSchema[i]].d
						)
					);

					pushed.push(this.groupSchema[i]);
				}
			}
			
			if (!editMode) {
				nextGroup = this.CreateGroupTitle("mono/other.svg", "other");
			}

			for (let key in hash) {
				if (!pushed.includes(key)) {

					if (nextGroup) {
						this.attributes.appendChild(nextGroup);
						nextGroup = null;
					}

					this.attributes.appendChild(
						this.CreateAttribute(
							key,
							hash[key].v,
							hash[key].i,
							hash[key].d
						)
					);
				}
			}

		} else {
			let sorted = [];
			for (let key in hash) {
				sorted.push(key);
			}
			sorted.sort((a,b)=> a.localeCompare(b));
			
			for (let i = 0; i < sorted.length; i++) {
				this.attributes.appendChild(
					this.CreateAttribute(
						sorted[i],
						hash[sorted[i]].v,
						hash[sorted[i]].i,
						hash[sorted[i]].d
					)
				);
			}
		}
	}

	Sort() {
		if (this.order === "alphabetical") {
			this.sortButton.style.borderBottom = "none";
			this.order = "group";
		} else {
			this.sortButton.style.borderBottom = "var(--clr-light) solid 3px";
			this.order = "alphabetical";
		}
		this.InitializePreview();
	}

	Info() {
		if (this.attributes.classList.contains("view-attributes-with-info")) {
			this.infoButton.style.borderBottom = "none";
			this.attributes.classList.remove("view-attributes-with-info");
		} else {
			this.infoButton.style.borderBottom = "var(--clr-light) solid 3px";
			this.attributes.classList.add("view-attributes-with-info");
		}
	}

	async Timeline() { //overridable
		if (this.timeline.style.display !== "none") {
			this.InitializeAttributesList(this.link);
			this.timeline.style.display = "none";
			this.scroll.style.top = "48px";
			this.timelineButton.style.borderBottom = "none";
			this.sortButton.removeAttribute("disabled");
			return;
		}

		if (this.timeline.firstChild) this.timeline.removeChild(this.timeline.firstChild);

		const innerTimeline = document.createElement("div");
		this.timeline.appendChild(innerTimeline);

		this.timeline.style.display = "initial";
		this.scroll.style.top = "96px";
		this.timelineButton.style.borderBottom = "var(--clr-light) solid 3px";
		this.sortButton.setAttribute("disabled", "true");

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

			if (i === 0) {
				dot.style.backgroundColor = "var(--clr-accent)";
				dot.style.border = "2px solid #404040";
			}

			sorted[i].x = x;
			sorted[i].con = con;

			let gap = lastStamp - x;
			if (maxGap.length < gap) maxGap = { index:i, length:gap };;
			lastStamp = x;

			con.onmouseenter = ()=> {
				this.floating.innerHTML = "";
				this.floating.style.visibility = "visible";
				this.floating.style.opacity = "1";
				
				let left = this.content.offsetLeft + this.timeline.offsetLeft + con.offsetLeft - 72.5;
				if (left < 0) left = 0;
				if (left + 200 > this.content.offsetWidth) left = this.content.offsetWidth - 200;
				this.floating.style.left = `${left}px`;
				this.floating.style.top = `${this.content.offsetTop + this.timeline.offsetTop + 44}px`;

				let date = new Date(sorted[i].time);
				let added = 0, modified = 0, unchanged = 0, removed = 0;

				if (i === sorted.length - 1) {
					for (let key in sorted[i].obj) {
						added++;
					}
					
				} else {
					for (let key in sorted[i].obj) {
						if (sorted[i+1].obj.hasOwnProperty(key)) {
							if (sorted[i].obj[key].v === sorted[i+1].obj[key].v) {
								unchanged++;
							} else {
								modified++;
							}

						} else {
							added++;
						}
					}

					for (let key in sorted[i+1].obj) {
						if (!sorted[i].obj.hasOwnProperty(key)) {
							removed++;
						}
					}
				}
			
				const dateBox = document.createElement("div");
				dateBox.style.textDecoration = "underline";
				dateBox.style.fontWeight = "600";
				dateBox.style.textAlign = "center";
				dateBox.style.marginTop = "4px";
				dateBox.style.marginBottom = "4px";
				dateBox.textContent = `${date.toLocaleDateString(UI.regionalFormat, {})} ${date.toLocaleTimeString(UI.regionalFormat, {})}`;
				this.floating.appendChild(dateBox);

				if (added > 0) {
					const addedBox = document.createElement("div");
					addedBox.style.backgroundImage = "url(mono/add.svg)";
					addedBox.style.backgroundSize = "16px 16px";
					addedBox.style.backgroundPosition = "4px 50%";
					addedBox.style.backgroundRepeat = "no-repeat";
					addedBox.style.margin = "2px";
					addedBox.style.paddingLeft = "24px";
					addedBox.textContent = `${added} added`;
					this.floating.appendChild(addedBox);
				}

				if (modified > 0) {
					const modBox = document.createElement("div");
					modBox.style.backgroundImage = "url(mono/edit.svg)";
					modBox.style.backgroundSize = "16px 16px";
					modBox.style.backgroundPosition = "4px 50%";
					modBox.style.backgroundRepeat = "no-repeat";
					modBox.style.margin = "2px";
					modBox.style.paddingLeft = "24px";
					modBox.textContent = `${modified} modified`;
					this.floating.appendChild(modBox);
				}

				if (removed > 0) {
					const removedBox = document.createElement("div");
					removedBox.style.backgroundImage = "url(mono/delete.svg)";
					removedBox.style.backgroundSize = "16px 16px";
					removedBox.style.backgroundPosition = "4px 50%";
					removedBox.style.backgroundRepeat = "no-repeat";
					removedBox.style.margin = "2px";
					removedBox.style.paddingLeft = "24px";
					removedBox.textContent = `${removed} removed`;
					this.floating.appendChild(removedBox);
				}
			};

			con.onmouseleave = ()=> {
				this.floating.style.visibility = "hidden";
				this.floating.style.opacity = "0";
			};

			con.onclick = ()=> {
				innerTimeline.childNodes.forEach(o=>o.firstChild.style.backgroundColor = "#404040");
				innerTimeline.childNodes.forEach(o=>o.firstChild.style.border = "none");
				innerTimeline.childNodes[i].firstChild.style.backgroundColor = "var(--clr-accent)";
				innerTimeline.childNodes[i].firstChild.style.border = "2px solid #404040";

				this.InitializeAttributesList(sorted[i].obj);

				if (i === sorted.length - 1) {
					for (let j = 0; j < this.attributes.childNodes.length; j++) {
						if (this.attributes.childNodes[j].childNodes.length < 2) continue;
						this.attributes.childNodes[j].style.backgroundImage = "url(mono/add.svg)";
					}

				} else {
					for (let j = 0; j < this.attributes.childNodes.length; j++) {
						if (this.attributes.childNodes[j].childNodes.length < 2) continue;

						let key = this.attributes.childNodes[j].childNodes[0].value;
						if (sorted[i+1].obj.hasOwnProperty(key)) {
							if (this.attributes.childNodes[j].childNodes[1].firstChild.value !== sorted[i+1].obj[key].v) {
								this.attributes.childNodes[j].style.backgroundImage = "url(mono/edit.svg)";
							}
						} else {
							this.attributes.childNodes[j].style.backgroundImage = "url(mono/add.svg)";
						}
					}
				}

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

		for (let i = 0; i < this.attributes.childNodes.length; i++) {
			if (this.attributes.childNodes[i].childNodes.length < 2) {
				this.attributes.childNodes[i].innerHTML = "";
				this.attributes.childNodes[i].style.height = "0px";
				this.attributes.childNodes[i].style.marginTop = "0px";
			
			} else {
				while (this.attributes.childNodes[i].childNodes[1].childNodes.length > 1) {
					this.attributes.childNodes[i].childNodes[1].removeChild(this.attributes.childNodes[i].childNodes[1].lastChild);
				}
				this.attributes.childNodes[i].childNodes[1].firstChild.style.display = "initial";
			}
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
			this.attributes.childNodes[i].childNodes[1].firstChild.removeAttribute("readonly");
		}

		addAttributeButton.onclick = ()=> {
			this.attributes.appendChild(this.CreateAttribute("", "", null, null, true));
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
				this.attributes.childNodes[i].childNodes[1].firstChild.setAttribute("readonly", "true");
			}
		};

		const Revert = editMode=> {
			this.InitializeAttributesList(this.link, editMode);
			for (let i = 0; i < this.attributes.childNodes.length; i++) {
				if (this.attributes.childNodes[i].childNodes.length < 3) continue;
				this.attributes.childNodes[i].childNodes[0].removeAttribute("readonly");
				this.attributes.childNodes[i].childNodes[1].firstChild.removeAttribute("readonly");

				while (this.attributes.childNodes[i].childNodes[1].childNodes.length > 1) {
					this.attributes.childNodes[i].childNodes[1].removeChild(this.attributes.childNodes[i].childNodes[1].lastChild);
				}
				this.attributes.childNodes[i].childNodes[1].firstChild.style.display = "initial";
			}
		};

		btnSave.onclick = ()=> {
			//TODO:
			ExitEdit();
		};

		btnRevert.onclick = ()=> {
			Revert(true);
		};

		btnCancel.onclick = ()=> {
			if (isNew) {
				this.Close();
			} else {
				this.InitializeAttributesList(this.link, false);
				ExitEdit();
			}
		};

		return btnSave;
	}

	Fetch() {} //overridable

	Copy() {} //overridable

	Delete() {} //overridable
}