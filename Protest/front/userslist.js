class UsersList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Users");
        this.SetIcon("/mono/users.svg");

        this.SetColumns(["title", "firstname", "lastname", "username", "email"]);
        this.InitializeToolbar();

        this.LinkArray(LOADER.users.data);
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