const DEVICES_GROUP_SCHEMA = [
    "type", "name",

    ["mono/portscan.svg", "network"],
    "ip", "ipv6", "mask", "hostname", "mac address", "dhcp enabled", "ports", "network adapter speed",
    "overwriteprotocol",

    [".", "device"],
    "manufacturer", "model", "serial number", "chasse type", "description",

    ["mono/motherboard.svg", "motherboard"],
    "motherboard", "motherboard manufacturer", "motherboard serial number", "bios",

    ["mono/cpu.svg", "processor"],
    "processor", "cpu cores", "cpu frequency", "cpu architecture", "cpu cache", "l1 cache", "l2 cache", "l3 cache",

    ["mono/ram.svg", "memory"],
    "memory", "total memory", "memory modules", "ram slot", "ram speed", "ram slot used", "ram type", "ram form factor",

    ["mono/diskdrive.svg", "disk drive"],
    "disk drive", "physical disk", "logical disk",

    ["mono/videocard.svg", "video card"],
    "video controller", "video driver",

    ["mono/os.svg", "operating system"],
    "operating system", "os architecture", "os version", "os build", "service pack", "os serial no", "os install date",

    ["mono/user.svg", "owner"],
    "owner", "owner full name", "location",

    ["mono/directory.svg", "active directory"],
    "distinguished name", "dns hostname", "created on dc",

    ["mono/credential.svg", "credentials"],
    "domain", "username", "password", "la password", "ssh username", "ssh password"
];

class DeviceView extends View {
	constructor(params) {
		super();
		this.params = params ? params : { file: null };

		this.link = LOADER.users.data[this.params.file];
		this.order = "group";
		this.groupSchema = DEVICES_GROUP_SCHEMA;
		this.timelineName = "devices";

		this.SetIcon("mono/gear.svg");

		if (this.params.file) {
			this.InitializePreview();
		} else {
			this.SetTitle("New Device");
			this.Edit(true);

			this.attributes.appendChild(this.CreateAttribute("type", "", null, null, true));

			this.attributes.appendChild(this.CreateAttribute("name", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("ip", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("hostname", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("mac address", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("manufacturer", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("model", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("location", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("owner", "", null, null, true));
		}
	}

	Edit(isNew = false) { //override
		const btnSave = super.Edit(isNew);
		btnSave.addEventListener("click", async ()=> {

			let obj = {};
			for (let i = 0; i < this.attributes.childNodes.length; i++) {
				if (this.attributes.childNodes[i].childNodes.length < 2) continue;
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