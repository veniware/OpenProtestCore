class List extends Window {
    constructor(params) {
        super();
        this.MIN_CELL_SIZE = 40;
        
        this.params = params ? params : { select:null, sort:"", filter:"", find:"" };
        this.AddCssDependencies("list.css");

        this.link = null;

        this.defaultColumns = [];
        this.columnsElements = [];
        this.sortDescend = false;
        this.resizingColumnElement = null;
        this.movingColumnElement = null;
        this.mouseX0 = 0;
        this.width0 = 0;
        this.left0 = 0;
        this.columnsWidth0 = [];

        this.list = document.createElement("div");
        this.list.className = "list-listbox no-results";
        this.list.onscroll = () => this.UpdateViewport();
        this.content.appendChild(this.list);

        this.listTitle = document.createElement("div");
        this.listTitle.className = "list-title";
        this.content.appendChild(this.listTitle);

        this.columnsOptions = document.createElement("div");
        this.columnsOptions.className = "list-columns-options";
        this.columnsOptions.onclick = () => this.CustomizeColumns();
        this.listTitle.appendChild(this.columnsOptions);
        
        this.counter = document.createElement("div");
        this.counter.className = "list-counter";
        this.content.appendChild(this.counter);

        this.win.addEventListener("mouseup", event => { this.List_mouseup(event); });
        this.win.addEventListener("mousemove", event=> { this.List_mousemove(event); });
    }

    List_mouseup(event) {
        if (this.resizingColumnElement || this.movingColumnElement) this.FinalizeColumns();
    }

    List_mousemove(event) {
        if (event.buttons !== 1) {
            if (this.resizingColumnElement || this.movingColumnElement) this.FinalizeColumns();
            return;
        }

        if (this.resizingColumnElement) {
            const index = this.columnsElements.indexOf(this.resizingColumnElement);
            const totalWidth = this.columnsWidth0.slice(index+1).reduce((accu, current) => accu + current);

            let targetWidth = Math.max(this.width0 + event.x - this.mouseX0, this.MIN_CELL_SIZE);
            
            const availableWidth = this.listTitle.offsetWidth - (this.resizingColumnElement.offsetLeft + targetWidth);

            let minWidth = 2160;
            for (let i = index+1; i < this.columnsElements.length; i++) {
                let w = availableWidth * this.columnsWidth0[i] / totalWidth;
                if (w < minWidth) minWidth = w;
            }

            if (minWidth < this.MIN_CELL_SIZE) return;

            this.resizingColumnElement.style.width = `${100 * targetWidth / this.listTitle.offsetWidth}%`;

            for (let i = index+1; i < this.columnsElements.length; i++) {
                let l = this.columnsElements[i-1].offsetLeft + this.columnsElements[i-1].offsetWidth;
                let w = availableWidth * this.columnsWidth0[i] / totalWidth;
                this.columnsElements[i].style.left = `${100 * l / this.listTitle.offsetWidth}%`;
                this.columnsElements[i].style.width = `${100 * w / this.listTitle.offsetWidth}%`;
            }
        }

        if (this.movingColumnElement) {
            let targetX = this.left0 + event.x - this.mouseX0;
            this.movingColumnElement.style.left = `${100 * targetX / this.listTitle.offsetWidth}%`;

            this.columnsElements = this.columnsElements.sort((a,b)=> a.offsetLeft - b.offsetLeft);

            for (let i = 0; i < this.columnsElements.length; i++) {
                if (this.columnsElements[i] === this.movingColumnElement) continue;
                
                let x = 0;
                for (let j = 0; j < i; j++) {
                    x += this.columnsElements[j].offsetWidth;
                }
                this.columnsElements[i].style.left = `${100 * x / this.listTitle.offsetWidth}%`;
            }
        }
    }

    SetupColumns(columns) {
        this.columnsElements = [];
        while (this.listTitle.firstChild) this.listTitle.removeChild(this.listTitle.firstChild);
        
        let isLastActionMeaningful = false;

        const Column_onmousedown = event => {
            let index = this.columnsElements.indexOf(event.target);
            this.mouseX0 = event.x;

            isLastActionMeaningful = false;

            if (event.layerX > event.target.offsetWidth - 8) {
                if (index >= this.columnsElements.length - 1) return;
                this.columnsElements.forEach(o=> o.style.transition = "0s");
                this.width0 = event.target.offsetWidth;
                this.columnsWidth0 = this.columnsElements.map(o=> o.offsetWidth);
                this.resizingColumnElement = event.target;
            } else {
                event.target.style.zIndex = "1";
                event.target.style.opacity = ".8";
                event.target.style.transition = "0s";
                this.left0 = event.target.offsetLeft;
                this.movingColumnElement = event.target;
            }
        };

        const Column_onmousemove = event => {
            let index = this.columnsElements.indexOf(event.target);
            if (index >= this.columnsElements.length - 1) return;
            event.target.style.cursor = event.layerX > event.target.offsetWidth - 8 ? "ew-resize" : "inherit";

            if (event.buttons !== 1) return;
            let delta = this.mouseX0 - event.x;
            
            if (Math.abs(delta) !== 0) {
                isLastActionMeaningful = true;
            }
        };

        const Column_onmouseup = event => {
            if (isLastActionMeaningful) return;
            
            const isAscend = event.target.className === "list-sort-ascend";

            this.columnsElements.forEach(o=>o.className = "");
            if (isAscend) {
                event.target.className = "list-sort-descend";
                this.sortDescend = true;
            } else {
                event.target.className = "list-sort-ascend";
                this.sortDescend = false;
            }
            
            this.params.sort = event.target.textContent;
            this.RefreshList();
        };

        for (let i = 0; i < columns.length; i++) {
            const newColumn = document.createElement("div");
            newColumn.style.left = `${100 * i / columns.length}%`;
            newColumn.style.width = `${100 / columns.length}%`;

            if (this.params.sort === columns[i]) {
                newColumn.className = "list-sort-ascend";
            }

            newColumn.onmousedown = event => Column_onmousedown(event);
            newColumn.onmousemove = event => Column_onmousemove(event);
            newColumn.onmouseup = event => Column_onmouseup(event);

            newColumn.textContent = columns[i];
            this.columnsElements.push(newColumn);
            this.listTitle.appendChild(newColumn);
        }

        this.listTitle.appendChild(this.columnsOptions);
        
        setTimeout(()=>{this.FinalizeColumns()}, 400);

        this.AfterResize();
    }

    SetupFilter() {
        if (!this.toolbar) return null;

        const filterButton = this.AddToolbarButton(null, "mono/filter.svg?light");
        
        const filterMenu = document.createElement("div");
        filterMenu.className = "win-toolbar-submenu";
        filterButton.appendChild(filterMenu);

        const findFilter = document.createElement("input");
        findFilter.type = "text";
        findFilter.placeholder = "Find";
        filterMenu.appendChild(findFilter);

        const filtersList = document.createElement("div");
        filtersList.className = "no-results-small";
        
        filterMenu.appendChild(filtersList);
        
        const ClearSelection = () => filtersList.childNodes.forEach(o=>o.style.backgroundColor = "");
        
        const Refresh = () => {
            let added = [];
            for (const key in this.link.data) {
                if (!this.link.data[key].hasOwnProperty("type")) continue;
                if (added.includes(this.array[key].type)) continue;
                if (this.array[key].indexOf(findFilter.value) < 0) continue;
                added.add(this.array[key].type);
            }
            added = added.sort();
            
            filtersList.innerHTML = "";
            filterMenu.style.height = `${32 + added.length * 26}px`;
            
            for (let i = 0; i < added.length; i++) {
                const newType = document.createElement("div");
                newType.textContent = added[i];
                filtersList.appendChild(newType);

                if (added[i] === this.params.filter) {
                    newType.style.backgroundColor = "var(--select-color)";
                    filterButton.style.borderBottom = "var(--theme-color) solid 2px";
                }

                newType.onclick = () => {
                    ClearSelection();

                    if (this.params.filter === added[i]) {
                        this.params.filter = "";
                        filterButton.style.borderBottom = "";
                    } else {
                        this.params.filter = added[i];
                        filterButton.style.borderBottom = "var(--theme-color) solid 2px";
                        newType.style.backgroundColor = "var(--select-color)";
                    }

                    this.RefreshList();
                };
            }
        };

        findFilter.onchange = event => {
            Refresh();
        };
        
        findFilter.onkeydown = event=> {
            if (event.key === "Escape") {
                findFilter.value = "";
                findFilter.onchange();
            }
        };

        filterButton.ondblclick = () => {
            this.params.filter = "";
            filterButton.style.borderBottom = "";
            ClearSelection();
            this.RefreshList();

        };

        filterButton.onfocus = ()=> {
            if (this.popoutWindow)
                filterButton.firstChild.style.maxHeight = this.content.clientHeight - 24 + "px";
            else
                filterButton.firstChild.style.maxHeight = container.clientHeight - this.win.offsetTop - 96 + "px";
        };
 
        filterMenu.onclick = filterMenu.ondblclick = event=> {
            event.stopPropagation();
        };

        Refresh();

        return filterButton;
    }

    SetupFind() {
        if (!this.toolbar) return null;

        const findButton = this.AddToolbarButton(null, "mono/search.svg?light");
        findButton.role = "textbox";
        findButton.tabIndex = "-1";
        findButton.style.overflow = "hidden";
        findButton.style.backgroundPosition = "2px center";

        const findTextbox = document.createElement("input");
        findTextbox.type = "text";
        findButton.appendChild(findTextbox);

        findButton.onfocus = ()=> {
            findTextbox.focus();
        };
        findTextbox.onfocus = ()=> {
            findButton.style.width = "200px";
        };

        findTextbox.onblur = ()=> {
            if (findTextbox.value.length === 0) findButton.style.width = "36px";
        };

        findTextbox.onchange = ()=> {
            findButton.style.backgroundColor = findTextbox.value.length === 0 ? "" : "rgb(72,72,72)";
        
            findTextbox.parentElement.style.borderBottom = findTextbox.value.length === 0 ? "none" : "var(--theme-color) solid 2px";
            this.params.find = findTextbox.value;
            this.RefreshList();
        };

        findTextbox.ondblclick = event => {
            if (event.layerX > 36) return;
            findTextbox.value = "";
            findTextbox.onchange();
        };

        findTextbox.onkeydown = event=> {
            if (event.key === "Escape") {
                findTextbox.value = "";
                findTextbox.onchange();
            }
        };

        return findTextbox;
    }

    AfterResize() { //override
        this.UpdateViewport();
    }

    Popout() { //override
        super.Popout();
        this.UpdateViewport(true);

        this.popoutWindow.addEventListener("mouseup", event => { this.List_mouseup(event); });
        this.popoutWindow.addEventListener("mousemove", event=> { this.List_mousemove(event); });
    }

    LinkData(data) {
        this.link = data;
    }

    FinalizeColumns() {
        this.resizingColumnElement = null;
        this.movingColumnElement = null;

        this.columnsElements = this.columnsElements.sort((a,b)=> a.offsetLeft - b.offsetLeft);

        //remove elements and append them in the correct order
        this.listTitle.innerHTML = "";
        for (let i = 0; i < this.columnsElements.length; i++) {
            this.listTitle.appendChild(this.columnsElements[i]);
        }
        this.listTitle.appendChild(this.columnsOptions);

        for (let i = 0; i < this.columnsElements.length; i++) {
            this.columnsElements[i].style.transition = ".2s";
            this.columnsElements[i].style.opacity = "1";
            this.columnsElements[i].style.zIndex = "0";
            this.columnsElements[i].style.cursor = "inherit";

            let x = 0;
            for (let j = 0; j < i; j++) {
                x += this.columnsElements[j].offsetWidth;
            }

            this.columnsElements[i].style.left = `${100 * x / this.listTitle.offsetWidth}%`;
            this.columnsElements[i].style.width = `${100 * this.columnsElements[i].offsetWidth / this.listTitle.offsetWidth}%`;
        }

        this.UpdateViewport(true);
    }

    RefreshList() {
        this.list.innerHTML = "";

        let filtered = [];
        if (this.params.filter.length === 0) {
            for (const key in this.link.data) {
                filtered.push(key);
            }

        } else {
            for (const key in this.link.data) {
                if (!this.link.data.hasOwnProperty("type")) continue;
                if (this.link.data.type !== this.params.filter) continue;
                filtered.push(key);
            }
        }

        let found;
        if (this.params.find.length === 0) {
            found = filtered;

        } else {
            found = [];
            const keywords = this.params.find.toLowerCase().split(" ");

            for (let i = 0; i < filtered.length; i++) {
                let flag = false;
    
                for (let j = 0; j < keywords.length; j++) {
                    if (keywords[j].length === 0) continue;

                    for (const key in this.link.data[filtered[i]]) {
                        if (this.link.data[filtered[i]][key].v.toLowerCase().indexOf(keywords[j]) > -1) {
                            flag = true;
                            continue;
                        }
                    }
                }

                if (flag) {
                    found.push(filtered[i]);
                    continue;
                }
            }
        }

        if (this.params.sort.length > 0) {
            const attr = this.params.sort;

            if (this.sortDescend) {
                found = found.sort((a, b) => {
                    if (this.link.data[a][attr] == undefined && this.link.data[b][attr] == undefined) return 0;
                    if (this.link.data[a][attr] == undefined) return -1;
                    if (this.link.data[b][attr] == undefined) return 1;
                    if (this.link.data[a][attr].v < this.link.data[b][attr].v) return 1;
                    if (this.link.data[a][attr].v > this.link.data[b][attr].v) return -1;
                    return 0;
                });
            } else {
                found = found.sort((a, b) => {
                    if (this.link.data[a][attr] == undefined && this.link.data[b][attr] == undefined) return 0;
                    if (this.link.data[a][attr] == undefined) return 1;
                    if (this.link.data[b][attr] == undefined) return -1;
                    if (this.link.data[a][attr].v < this.link.data[b][attr].v) return -1;
                    if (this.link.data[a][attr].v > this.link.data[b][attr].v) return 1;
                    return 0;
                });
            }
        }

        for (let i = 0; i < found.length; i++) {
            const newElement = document.createElement("div");
            newElement.id = found[i];
            newElement.className = "list-element";
            this.list.appendChild(newElement);

            if (found[i] === this.params.select) {
                this.selected = newElement;
            }
        }

        if (this.selected) {
            this.selected.style.backgroundColor = "var(--select-color)";
            setTimeout(()=> {
                this.selected.scrollIntoView({behavior: "smooth", block: "center"});
            }, 100);
        }

        this.UpdateViewport();
    }

    UpdateViewport(force = false) {
        for (let i = 0; i < this.list.childNodes.length; i++) {
            if (force) this.list.childNodes[i].textContent = "";

            if (this.list.childNodes[i].offsetTop - this.list.scrollTop < -32 ||
                this.list.childNodes[i].offsetTop - this.list.scrollTop > this.list.clientHeight) {
                this.list.childNodes[i].textContent = "";
            } else {
                if (this.list.childNodes[i].childNodes.length > 0) continue;
                const key = this.list.childNodes[i].getAttribute("id");
                let type = (this.link.data[key].hasOwnProperty("type")) ? this.link.data[key]["type"].v.toLowerCase() : null;
                this.InflateElement(this.list.childNodes[i], this.link.data[key], type);
            }
        }

        if (this.link) {
            this.counter.textContent = this.list.childNodes.length === this.link.length ?
                this.link.length :
                `${this.list.childNodes.length} / ${this.link.length}`;
        }
    }

    InflateElement(element, entry, c_type) { //overridable
        const icon = document.createElement("div");
        icon.className = "list-element-icon";
        icon.style.backgroundImage = "url(/mono/user.svg)";
        element.appendChild(icon);
        
        for (let i = 0; i < this.columnsElements.length; i++) {
            if (!entry.hasOwnProperty(this.columnsElements[i].textContent)) continue;
            
            const newAttr = document.createElement("div");
            newAttr.textContent = entry[this.columnsElements[i].textContent].v;
            element.appendChild(newAttr);

            if (i === 0) {
                newAttr.style.left = "36px";
                newAttr.style.width = `calc(${this.columnsElements[0].style.width} - 36px)`;
            } else {
                newAttr.style.left = this.columnsElements[i].style.left;
                newAttr.style.width = this.columnsElements[i].style.width;
            }
        }

        element.onclick = () => {
            if (this.selected)
                this.selected.style.backgroundColor = "";

            this.params.select = element.getAttribute("id");
            
            this.selected = element;
            element.style.backgroundColor = "var(--select-color)";
        };
    }

    CustomizeColumns() {
        const dialog = this.DialogBox("500px");
        if (dialog === null) return;

        const btnOK = dialog.btnOK;
        const btnCancel = dialog.btnCancel;
        const buttonBox = dialog.buttonBox;

        const innerBox = dialog.innerBox;
        innerBox.style.display = "grid";
        innerBox.style.padding = "8px";
        innerBox.style.gridGap = "4px";
        innerBox.style.gridTemplateColumns = "auto min(400px, 76%) min(108px, 16%) auto";
        innerBox.style.gridTemplateRows = "32px auto";

        const filter = document.createElement("input");
        filter.type = "text";
        filter.placeholder = "Find";
        filter.style.gridColumn = "2";
        filter.style.gridRow = "1";
        innerBox.appendChild(filter);

        const listbox = document.createElement("div");
        listbox.className = "check-list";
        listbox.style.margin = "0 4px";
        listbox.style.gridColumn = "2";
        listbox.style.gridRow = "2";
        innerBox.appendChild(listbox);

        const buttons = document.createElement("div");
        buttons.style.gridColumn = "3";
        buttons.style.gridRow = "2";
        buttons.style.overflow = "hidden";
        innerBox.appendChild(buttons);

        const btnMoveUp = document.createElement("input");
        btnMoveUp.setAttribute("disabled", true);
        btnMoveUp.type = "button";
        btnMoveUp.value = "Move up";
        btnMoveUp.style.width = "calc(100% - 4px)";
        btnMoveUp.style.minWidth = "20px";
        buttons.appendChild(btnMoveUp);
        
        const btnMoveDown = document.createElement("input");
        btnMoveDown.setAttribute("disabled", true);
        btnMoveDown.type = "button";
        btnMoveDown.value = "Move down";
        btnMoveDown.style.width = "calc(100% - 4px)";
        btnMoveDown.style.minWidth = "20px";
        buttons.appendChild(btnMoveDown);

        const btnUndo = document.createElement("input");
        btnUndo.type = "button";
        btnUndo.value = "Undo";
        btnUndo.style.width = "calc(100% - 4px)";
        btnUndo.style.minWidth = "20px";
        btnUndo.style.marginTop = "16px";
        buttons.appendChild(btnUndo);

        const btnReset = document.createElement("input");
        btnReset.type = "button";
        btnReset.value = "Reset";
        btnReset.style.width = "calc(100% - 4px)";
        btnReset.style.minWidth = "20px";
        buttons.appendChild(btnReset);


        let checkList = {};
        const CreateListItem =(attr, value)=> {
            const newAttr = document.createElement("div");
            const newCheck = document.createElement("input");
            newCheck.type = "checkbox";
            newCheck.checked = checkList.hasOwnProperty(attr) ? checkList[attr] : value;
            newAttr.appendChild(newCheck);

            const newLabel = this.AddCheckBoxLabel(newAttr, newCheck, attr);
            listbox.appendChild(newAttr);
            checkList[attr] = newCheck.checked;

            newLabel.onmousedown = event=> event.stopPropagation();

            newAttr.onmousedown = ()=> {
                newCheck.checked = !newCheck.checked;
                checkList[attr] = newCheck.checked;
            };

            newCheck.onchange = ()=> {
                checkList[attr] = newCheck.checked;
            };
        };

        const Refresh = ()=> {
            let attributes = [];
            listbox.innerHTML = "";
            let keyword = filter.value.toLowerCase();
            for (let i = 0; i < this.columnsElements.length; i++) { //selected
                let attr = this.columnsElements[i].textContent;
                if (attributes.includes(attr)) continue;
                if (attr.indexOf(keyword) === -1) continue;
                CreateListItem(attr, true);
                attributes.push(attr);
            }

            for (let i = 0; i < this.defaultColumns.length; i++) { //default
                let attr = this.defaultColumns[i];
                if (attributes.includes(attr)) continue;
                if (attr.indexOf(keyword) === -1) continue;
                CreateListItem(attr, false);
                attributes.push(attr);
            }
    
            for (const key in this.link.data) { //all attributes
                for (const attr in this.link.data[key]) {
                    if (attributes.includes(attr)) continue;
                    if (attr.indexOf(keyword) === -1) continue;
                    CreateListItem(attr, false);
                    attributes.push(attr);
                }
            }
        }

        const Apply = ()=> {
            this.listTitle.innerHTML = "";
            this.columnsElements = [];

            let columns = [];
            for (let key in checkList) {
                if (!checkList[key]) continue;
                columns.push(key);
            }

            this.SetupColumns(columns);
            this.UpdateViewport(true);
        };

        filter.onchange = ()=> {
            Refresh();
        };

        btnUndo.onclick = ()=> {
            checkList = {};
            Refresh();
        };

        btnReset.onclick = ()=> {
            checkList = {};
            this.defaultColumns.forEach(o=>checkList[o] = true);
            Refresh();
        };

        const btnApplyAll = document.createElement("input");
        btnApplyAll.type = "button";
        btnApplyAll.value = "Apply to all";
        btnApplyAll.style.width = "100px";
        
        btnOK.value = "Apply";

        buttonBox.appendChild(btnApplyAll);
        buttonBox.appendChild(btnOK);
        buttonBox.appendChild(btnCancel);

        btnApplyAll.addEventListener("click", event => {
            Apply();
            
            btnCancel.onclick();
            localStorage.setItem(`${this.constructor.name.toLowerCase()}_columns`, JSON.stringify(this.columnsElements.map(o=>o.textContent)));
        });

        btnOK.addEventListener("click", event => {
            Apply();
        });

        Refresh();
    }

}