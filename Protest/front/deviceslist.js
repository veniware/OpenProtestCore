class DevicesList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Devices");
        this.SetIcon("/mono/devices.svg");

        this.SetColumns(["name", "type", "ip", "hostname", "mac address", "serial no"]);
        this.InitializeToolbar();

        this.LinkArray(LOADER.devices);
    }
}

new DevicesList();