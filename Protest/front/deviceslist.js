class DevicesList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Devices");
        this.SetIcon("/mono/devices.svg");

        this.SetColumns(["name", "type", "ip", "hostname", "mac address", "serial no"]);
        this.SetupToolbar();

        this.LinkArray(LOADER.devices.data);
        this.RefreshList();
    }

    InflateElement(element, entry, type) { //override
        super.InflateElement(element, entry, type);

        if (!element.ondblclick)
            element.ondblclick = (event) => {

                event.stopPropagation();
            };
    }
}