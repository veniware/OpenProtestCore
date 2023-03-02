class UserView extends View {
	constructor(params) {
		super();
		this.params = params ? params : { file: null };

		this.link = LOADER.users.data[this.params.file];
		this.timelineName = "users";

		this.SetIcon("mono/user.svg");

		if (this.params.file) {
			this.InitializePreview();
		} else {
			this.SetTitle("New user");
			this.Edit(true);

			this.AddAttribute("type", "", null, true);

			this.AddAttribute("title", "", null, true);
			this.AddAttribute("department", "", null, true);
			this.AddAttribute("firstname", "", null, true);
			this.AddAttribute("lastname", "", null, true);
			this.AddAttribute("username", "", null, true);
			this.AddAttribute("email", "", null, true);
			this.AddAttribute("office number", "", null, true);
			this.AddAttribute("mobile number", "", null, true);
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