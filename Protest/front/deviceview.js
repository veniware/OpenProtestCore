class DeviceView extends View {
	constructor(params) {
		super();
		this.params = params ? params : { file: null };

		this.link = LOADER.users.data[this.params.file];

		this.SetIcon("mono/gear.svg");

		if (this.params.file) {
			this.InitializePreview();
		} else {
			this.SetTitle("New Device");
			this.Edit(true);

			this.AddAttribute("name", "", null, true);
			this.AddAttribute("type", "", null, true);
			this.AddAttribute("ip", "", null, true);
			this.AddAttribute("hostname", "", null, true);
			this.AddAttribute("mac address", "", null, true);
			this.AddAttribute("manufacturer", "", null, true);
			this.AddAttribute("model", "", null, true);
			this.AddAttribute("location", "", null, true);
		}
	}

	async Timeline() { //override
		const toggle = super.Timeline();
		if (!toggle) return;

		try {
			const response = await fetch(`db/devices/timeline?file=${this.params.file}`, {
				method: "GET",
				cache: "no-cache",
				credentials: "same-origin"
			});

			if (response.status !== 200) throw(response.status);

			const json = await response.json();
			if (json.error) return;

			let min=Number.MAX_SAFE_INTEGER, max=0;
			for (const key in json) {
				let int = parseInt(key);
				if (min > int) min = int;
				if (max < int) max = int;
			}

			for (const key in json) {
				let int = parseInt(key);
				console.log(json[key]);
			}

		} catch (error) {
			console.error(error);
		}
	}

	Edit(isNew = false) { //override
		const btnSave = super.Edit(isNew);
		btnSave.addEventListener("click", async ()=> {

			let obj = {};
			for (let i = 0; i < this.attributes.childNodes.length; i++) {
				let name  = this.attributes.childNodes[i].childNodes[0].value;
				let value = this.attributes.childNodes[i].childNodes[1].value;
				obj[name] = {v:value};
			}

			let path = this.params.file ? `db/devices/save?file=${this.params.file}` : "db/devices/save";

			try {
				const response = await fetch(path, {
					method: "POST",
					cache: "no-cache",
					credentials: "same-origin",
					body: JSON.stringify(obj)
				});

				if (response.status !== 200) throw(response.status);

				const json = await response.json();
				if (json.error) throw(json.error);

				this.params.file = json.filename;
				this.link = obj;
				LOADER.devices.data[json.filename] = obj;

				for (let i = 0; i < WIN.array.length; i++) {
					if (WIN.array[i] instanceof DevicesList) {
						if (isNew && WIN.array[i].MatchFilters(obj)) {
							const newElement = document.createElement("div");
							newElement.id = json.filename;
							newElement.className = "list-element";
							WIN.array[i].list.appendChild(newElement);
						}
						WIN.array[i].UpdateViewport(true);
					}
				}

			} catch (error) {
				console.error(error);
			}
		});
	}

	Fetch() { //override

	}

	Delete() { //override
		this.ConfirmBox("Are you sure you want to delete this device?").addEventListener("click", async ()=> {
			try {
				const response = await fetch(`db/devices/delete?file=${this.params.file}`, {
					method: "GET",
					cache: "no-cache",
					credentials: "same-origin",
				});
	
				const json = response.json();
	
				if (response.status !== 200) return;				
				if (json.error) throw(json.error);
	
				delete LOADER.devices.data[this.params.file];
				LOADER.devices.length--;
	
				for (let i = 0; i < WIN.array.length; i++) {
					if (WIN.array[i] instanceof DevicesList) {
						let element = Array.from(WIN.array[i].list.childNodes).filter(o=>o.getAttribute("id") === this.params.file);
						element.forEach(o => WIN.array[i].list.removeChild(o));
	
						WIN.array[i].UpdateViewport(true);
					}
				}
	
				this.Close();

			} catch (error) {
				console.error(error);
			}
		});
	}
}