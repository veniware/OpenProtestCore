class DeviceView extends View {
    constructor(params) {
        super();
        this.params = params ? params : { file: null };

        this.link = LOADER.devices.data[this.params.file];

        this.SetIcon("/mono/gear.svg");

        if (this.params.file) {
            this.InitializePreview();
        } else {
            this.SetTitle("New Device");
        }
    }
}