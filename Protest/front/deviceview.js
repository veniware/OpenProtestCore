class DeviceView extends View {
    constructor(params) {
        super();
        this.params = params ? params : { file: null };

        this.link = LOADER.devices.data[this.params.file];

        this.SetIcon("mono/gear.svg");

        if (this.params.file) {
            this.InitializePreview();
        } else {
            this.SetTitle("New Device");
        }
    }

    Edit() { //overrides
        const btnSave = super.Edit();
        btnSave.addEventListener("click", ()=>{
            console.log("TODO: save device");
        });
    }

    Fetch() { //overrides

    }

    Delete() { //overrides
        this.ConfirmBox("Are you sure you want to delete this device?").addEventListener("click", ()=> {
            
        });
    }
}