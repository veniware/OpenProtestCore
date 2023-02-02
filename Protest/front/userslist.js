class UsersList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Users");
        this.SetIcon("/mono/users.svg");

        this.SetColumns(["title", "firstname", "lastname", "username", "email"]);
        this.SetupToolbar();

        this.LinkData(LOADER.users);
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