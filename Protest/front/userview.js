class UserView extends View {
    constructor(params) {
        super();
        this.params = params ? params : { file: null };

        this.link = LOADER.users.data[this.params.file];

        this.SetIcon("/mono/user.svg");

        if (this.params.file) {
            this.InitializePreview();
        } else {
            this.SetTitle("New user");
        }
    }
}