class DevicesList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Devices");
        this.SetIcon("/mono/devices.svg");

        this.SetColumns(["name", "type", "ip", "hostname", "mac address", "serial no"]);
        this.SetupToolbar();

        this.LinkData(LOADER.devices);
        this.RefreshList();

        const addButton    = this.AddToolbarButton("Add", "mono/add.svg?light");
        const removeButton = this.AddToolbarButton("Delete", "mono/delete.svg?light");
        const filterButton = this.SetupFilter();
        const searchButton = this.SetupSearch();
    }

    InflateElement(element, entry, type) { //override
        super.InflateElement(element, entry, type);

        if (!element.ondblclick)
            element.ondblclick = (event) => {
                event.stopPropagation();
                console(element.getAttribute(id));
            };
    }
}