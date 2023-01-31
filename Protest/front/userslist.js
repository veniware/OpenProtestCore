class UsersList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Users");
        this.SetIcon("/mono/users.svg");

        this.SetColumns(["title", "firstname", "lastname", "username", "email"]);
        this.InitializeToolbar();

        this.LinkArray(LOADER.users.data);
        this.RefreshList();

        const addButton = document.createElement("div");
        addButton.className = "win-toolbar-button";
        addButton.style.backgroundImage = "url(mono/add.svg?light)";
        addButton.setAttribute("tip-below", "Add");
        this.toolbar.appendChild(addButton);

        const removeButton = document.createElement("div");
        removeButton.className = "win-toolbar-button";
        removeButton.style.backgroundImage = "url(mono/delete.svg?light)";
        removeButton.setAttribute("tip-below", "Delete");
        this.toolbar.appendChild(removeButton);

        const filterButton = document.createElement("div");
        filterButton.className = "win-toolbar-button";
        filterButton.style.backgroundImage = "url(mono/filter.svg?light)";
        this.toolbar.appendChild(filterButton);

        const sortButton = document.createElement("div");
        sortButton.className = "win-toolbar-button";
        sortButton.style.backgroundImage = "url(mono/sort.svg?light)";
        this.toolbar.appendChild(sortButton);

        const searchButton = document.createElement("div");
        searchButton.className = "win-toolbar-button";
        searchButton.style.backgroundImage = "url(mono/search.svg?light)";
        this.toolbar.appendChild(searchButton);
    }

    InflateElement(element, entry, type) { //override
        super.InflateElement(element, entry, type);

        if (!element.ondblclick)
            element.ondblclick = (event) => {

                event.stopPropagation();
            };
    }
}