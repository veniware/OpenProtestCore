class UsersList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Users");
        this.SetIcon("mono/users.svg");

        this.defaultColumns = ["firstname", "lastname", "username", "email"];

        const columns = localStorage.getItem(`${this.constructor.name.toLowerCase()}_columns`) ?
            JSON.parse(localStorage.getItem(`${this.constructor.name.toLowerCase()}_columns`)) :
            this.defaultColumns;

        this.SetupColumns(columns);
        this.SetupToolbar();
        this.LinkData(LOADER.users);
        this.RefreshList();

        const addButton    = this.AddToolbarButton("Add", "mono/add.svg?light");
        const removeButton = this.AddToolbarButton("Delete", "mono/delete.svg?light");
        const filterButton = this.SetupFilter();
        const findTextBox  = this.SetupFind();

        if (this.params.find && this.params.find.length > 0) {
            findTextBox.value = this.params.find;
            findTextBox.parentElement.style.borderBottom = findTextBox.value.length === 0 ? "none" : "#c0c0c0 solid 2px";
            findTextBox.parentElement.style.width = "200px";
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
                    if (WIN.array[i] instanceof UserView && WIN.array[i].params.file === file) {
                        WIN.array[i].Minimize(); //minimize/restore
                        return;
                    }

                new UserView({ file: element.getAttribute("id") });
            };
        }
    }
}