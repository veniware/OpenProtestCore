class UsersList extends List {
    constructor(params) {
        super(params);

        this.SetTitle("Users");
        this.SetIcon("/mono/users.svg");

        this.SetColumns(["title", "firstname", "lastname", "username", "email"]);
        this.SetupToolbar();

        this.LinkArray(LOADER.users.data);
        this.RefreshList();

        const addButton    = this.AddToolbarButton("Add", "mono/add.svg?light");
        const removeButton = this.AddToolbarButton("Delete", "mono/delete.svg?light");
        const filterButton = this.SetupFilter();
        
        const searchButton = this.AddToolbarButton(null, "mono/search.svg?light");
        searchButton.style.overflow = "hidden";
        searchButton.style.backgroundPosition = "2px center";

        const searchText = document.createElement("input");
        searchText.type = "text";
        searchButton.appendChild(searchText);

        filterButton.onfocus = ()=>{
            if (this.popoutWindow)
                filterButton.firstChild.style.maxHeight = this.content.clientHeight - 24 + "px";
            else
                filterButton.firstChild.style.maxHeight = container.clientHeight - this.win.offsetTop - 96 + "px";
        };
        
        searchButton.onfocus = ()=> {
            searchText.focus();
        };
        searchText.onfocus = ()=> {
            searchButton.style.width = "200px";
        };
        searchText.onblur = ()=> {
            if (searchText.value.length === 0) searchButton.style.width = "36px";
        };
        searchText.onchange = searchText.oninput = () =>{
            searchButton.style.backgroundColor = searchText.value.length === 0 ? "" : "rgb(72,72,72)";
        };
        searchText.onkeydown = event=> {
            if (event.key === "Escape") {
                searchText.value = "";
                searchText.onchange();
            }
        };

    }

    InflateElement(element, entry, type) { //override
        super.InflateElement(element, entry, type);

        if (!element.ondblclick)
            element.ondblclick = (event) => {

                event.stopPropagation();
            };
    }
}