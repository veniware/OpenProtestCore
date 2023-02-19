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
				if (response.status === 200) {

				}
			})
			.catch(error =>{

			});
		});
	}

	Fetch() { //override

	}

	Delete() { //override
		this.ConfirmBox("Are you sure you want to delete this user?").addEventListener("click", ()=> {
			
		});
	}
}