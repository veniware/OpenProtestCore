class UserView extends View {
	static USERS_GROUP_SCHEMA = [
		"type", "title", "department", "division", "company",
	
		["mono/user.svg", "general"],
		"first name", "middle name", "last name", "display name", "employee id",
	
		["mono/credential.svg", "authentication"],
		"domain", "username", "password",
	
		["mono/contact.svg", "contact information"],
		"e-mail", "secondary e-mail", "telephone number", "mobile number", "mobile extension", "fax",
	
		["mono/sim.svg", "sim information"],
		"sim", "puk", "voicemail"
	];

	constructor(params) {
		super();
		this.params = params ? params : { file: null };

		this.link = LOADER.users.data[this.params.file];
		this.order = "group";
		this.groupSchema = UserView.USERS_GROUP_SCHEMA;
		this.timelineName = "users";

		this.SetIcon("mono/user.svg");

		if (this.params.file) {
			this.InitializePreview();
		
		} else if (params.copy) {
			this.SetTitle(`Copy of ${this.params.copy}`);
			this.Edit(true);

		} else {
			this.SetTitle("New user");
			this.Edit(true);

			this.attributes.appendChild(this.CreateAttribute("type", "", null, null, true));

			this.attributes.appendChild(this.CreateAttribute("title", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("department", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("first name", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("last name", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("username", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("email", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("office number", "", null, null, true));
			this.attributes.appendChild(this.CreateAttribute("mobile number", "", null, null, true));
		}
	}

	Edit(isNew = false) { //override
		const btnSave = super.Edit(isNew);
		btnSave.addEventListener("click", async ()=> {

			let obj = {};
			for (let i = 0; i < this.attributes.childNodes.length; i++) {
				if (this.attributes.childNodes[i].childNodes.length < 2) continue;
				let name  = this.attributes.childNodes[i].childNodes[0].value;
				let value = this.attributes.childNodes[i].childNodes[1].firstChild.value;
				obj[name] = {v:value};
			}

			let path = this.params.file ? `db/users/save?file=${this.params.file}` : "db/users/save";

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
				LOADER.users.data[json.filename] = obj;

				this.InitializeAttributesList(obj, false);

				for (let i = 0; i < WIN.array.length; i++) {
					if (WIN.array[i] instanceof UsersList) {
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
				console.log(error);
			}
		});
	}

	Fetch() { //override
		this.DialogBox("400px");
	}

	Copy() { //override
		const copy = new UserView({copy: this.header.textContent});
		for (let i = 0; i < this.attributes.childNodes.length; i++) {
			if (this.attributes.childNodes[i].childNodes.length < 3) continue;
			copy.attributes.appendChild(
				copy.CreateAttribute(
					this.attributes.childNodes[i].childNodes[0].value,
					this.attributes.childNodes[i].childNodes[1].firstChild.value,
					null, null, true
				)
			);
		}
	}

	Delete() { //override
		this.ConfirmBox("Are you sure you want to delete this user?").addEventListener("click", async()=> {
			try {
				const response = await fetch(`db/users/delete?file=${this.params.file}`, {
					method: "GET",
					cache: "no-cache",
					credentials: "same-origin",
				});

				if (response.status !== 200) return;
			
				const json = await response.json();	
				if (json.error) throw(json.error);
	
				delete LOADER.users.data[this.params.file];
				LOADER.users.length--;
	
				for (let i = 0; i < WIN.array.length; i++) {
					if (WIN.array[i] instanceof UsersList) {
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