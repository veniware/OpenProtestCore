class UserView extends View {
	constructor(params) {
		super();
		this.params = params ? params : { file: null };

		this.link = LOADER.users.data[this.params.file];

		this.SetIcon("mono/user.svg");

		if (this.params.file) {
			this.InitializePreview();
		} else {
			this.SetTitle("New user");
		}
	}

	Edit() { //overrides
		const btnSave = super.Edit();
		btnSave.addEventListener("click", async ()=>{

			let obj = {};
			for (let i = 0; i < this.attributes.childNodes.length; i++) {
				let name  = this.attributes.childNodes[i].childNodes[0].value;
				let value = this.attributes.childNodes[i].childNodes[1].value;
				obj[name] = value;
			}

			await fetch("/saveuser", {
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

	Fetch() { //overrides

	}

	Delete() { //overridable
		this.ConfirmBox("Are you sure you want to delete this user?").addEventListener("click", ()=> {
			
		});
	}
}