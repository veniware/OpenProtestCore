class UsersList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Users");
        this.SetIcon("/mono/users.svg");

        this.SetColumns(["username", "email", "firstname", "lastname"]);
        this.InitializeToolbar();

        this.LinkArray(LOADER.users);
    }
}

new UsersList();