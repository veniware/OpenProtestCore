class DevicesList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Devices");
        this.SetIcon("mono/devices.svg");

        this.defaultColumns = ["name", "type", "ip", "hostname", "mac address", "serial no"];

        const columns = localStorage.getItem(`${this.constructor.name.toLowerCase()}_columns`) ?
            JSON.parse(localStorage.getItem(`${this.constructor.name.toLowerCase()}_columns`)) :
            this.defaultColumns;

        this.SetupColumns(columns);
        this.SetupToolbar();
        this.LinkData(LOADER.devices);
        this.RefreshList();

        const addButton    = this.AddToolbarButton("Add", "mono/add.svg?light");
        const removeButton = this.AddToolbarButton("Delete", "mono/delete.svg?light");
        const filterButton = this.SetupFilter();
        const findTextbox  = this.SetupFind();

        if (this.params.find && this.params.find.length > 0) {
            findTextbox.value = this.params.find;
            findTextbox.parentElement.style.borderBottom = findTextbox.value.length === 0 ? "none" : "#c0c0c0 solid 2px";
            findTextbox.parentElement.style.width = "200px";
            this.RefreshList();
        }
    }

    InflateElement(element, entry, type) { //override
        super.InflateElement(element, entry, type);

        if (!element.ondblclick) {
            element.ondblclick = (event) => {
                event.stopPropagation();
                
                const file = element.getAttribute("id");
                for (let i = 0; i < WIN.array.length; i++)
                    if (WIN.array[i] instanceof EquipView && WIN.array[i].params.file === file) {
                        WIN.array[i].Minimize(); //minimize/restore
                        return;
                    }

                new EquipView({ file: element.getAttribute("id") });
            };
        }
    }
}