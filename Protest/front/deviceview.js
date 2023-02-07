class DeviceView extends Window {
    constructor(params) {
        super();
        this.params = params ? params : { file: null };

        this.SetTitle("TODO");
        this.SetIcon("/mono/gear.svg");

        this.attributes = document.createElement("div");
        this.attributes.className = "";
        this.content.appendChild(this.attributes);

        if (this.params.file) {
            this.InitializePreview();
        } else {
            //TODO: new
        }
    }

    InitializePreview() {
        this.attributes.innerHTML = "";

        const obj = LOADER.devices.data[this.params.file];
        for (attr in obj) {
            
        }

    }
}