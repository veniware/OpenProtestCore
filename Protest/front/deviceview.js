class DeviceView extends Window {
    constructor(params) {
        super();
        this.params = params ? params : { file: null };

        this.SetIcon("/mono/gear.svg");

        this.attributes = document.createElement("div");
        this.attributes.className = "";
        this.content.appendChild(this.attributes);

        if (this.params.file) {
            this.InitializePreview();
        } else {
            this.SetTitle("New Device");
        }
    }

    InitializePreview() {
        this.attributes.innerHTML = "";

        const obj = LOADER.devices.data[this.params.file];

        this.SetTitle(obj.name.v ? obj.title.name.v : "");

        for (attr in obj) {
            
        }

    }
}