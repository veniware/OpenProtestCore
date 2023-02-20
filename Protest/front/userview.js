class UserView extends View {
	constructor(params) {
		super();
		this.params = params ? params : { file: null };
		this.file = params.file;

		this.link = LOADER.users.data[this.file];

		this.SetIcon("mono/user.svg");

		if (this.file) {
			this.InitializePreview();
		} else {
			this.SetTitle("New user");
		}
	}

	Edit() { //override
		const btnSave = super.Edit();
		btnSave.addEventListener("click", async ()=>{

			let obj = {};
			for (let i = 0; i < this.attributes.childNodes.length; i++) {
				let name  = this.attributes.childNodes[i].childNodes[0].value;
				let value = this.attributes.childNodes[i].childNodes[1].value;
				obj[name] = {v:value};
			}

			let path = this.file ? `/db/saveuser?file=${this.file}` : "/db/saveuser";

			await fetch(path, {
				method: "POST",
				cache: "no-cache",
				credentials: "same-origin",
				body: JSON.stringify(obj)
			}) 
			.then(response => {
				if (response.status !== 200) return;
				return response.json();
			})
			.then(json => {
				if (json.error) throw(json.error);
				this.link = obj;
				LOADER.users.data[json.filename] = obj;

				for (let i = 0; i < WIN.array.length; i++) {
					if (WIN.array[i] instanceof UsersList) {
						WIN.array[i].UpdateViewport(true);
					}
				}
			})
			.catch(error =>{
				console.log(error);
			});
		});
	}

	Fetch() { //override
	
	}

	Delete() { //override
		this.ConfirmBox("Are you sure you want to delete this user?").addEventListener("click", async()=> {
			await fetch(`db/deleteuser?file=${this.file}`, {
				method: "GET",
				cache: "no-cache",
				credentials: "same-origin",
			}) 
			.then(response => {
				if (response.status !== 200) return;
				return response.json();
			})
			.then(json => {
				if (json.error) throw(json.error);

				delete LOADER.users.data[this.file];
				LOADER.users.length--;

				for (let i = 0; i < WIN.array.length; i++) {
					if (WIN.array[i] instanceof UsersList) {

						let element = Array.from(WIN.array[i].list.childNodes).filter(o=>o.getAttribute("id") === this.file);
						element.forEach(o => WIN.array[i].list.removeChild(o));

						WIN.array[i].UpdateViewport(true);
					}
				}

				this.params.select = null;
			})
			.catch(error =>{
				console.error(error);
			});
		});
	}
}