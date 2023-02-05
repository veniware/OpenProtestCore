class DeviceView extends Window {
    constructor(params) {
        super();
        this.params = params ? params : { file: null };

        this.SetTitle("TODO");
        this.SetIcon("/mono/gear.svg");
    }
}