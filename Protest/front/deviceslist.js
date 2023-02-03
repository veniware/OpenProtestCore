class DevicesList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Devices");
        this.SetIcon("/mono/devices.svg");

        this.SetupColumns(["name", "type", "ip", "hostname", "mac address", "serial no"]);
        this.SetupToolbar();

        this.LinkData(LOADER.devices);
        this.RefreshList();

        const addButton    = this.AddToolbarButton("Add", "mono/add.svg?light");
        const removeButton = this.AddToolbarButton("Delete", "mono/delete.svg?light");
        const filterButton = this.SetupFilter();
        const findTextbox  = this.SetupFind();

        if (params.find && params.find.length > 0) {
            findTextbox.value = params.find;
            findTextbox.style.borderBottom = findTextbox.value.length === 0 ? "none" : "var(--theme-color) solid 2px";
            findTextbox.parentElement.style.width = "200px";
            this.RefreshList();
        }
    }

    InflateElement(element, entry, type) { //override
        super.InflateElement(element, entry, type);

        if (!element.ondblclick)
            element.ondblclick = (event) => {
                event.stopPropagation();
                console.log(element.getAttribute("id"));
            };
    }
}