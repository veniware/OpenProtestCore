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
        btnSave.addEventListener("click", ()=>{
            console.log("TODO: save user");
        });
    }

    Fetch() { //overrides

    }

    Delete() { //overridable
        this.ConfirmBox("Are you sure you want to delete this user?").addEventListener("click", ()=> {
            
        });
    }
}