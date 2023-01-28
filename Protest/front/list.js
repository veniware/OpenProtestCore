class List extends Window {
    constructor(params) {
        super();
        this.MIN_CELL_SIZE = 20;
        
        this.params = params ? params : { sort:"", filter:"", find:"" };
        this.AddCssDependencies("list.css");

        this.array = null;

        this.columnsElements = [];
        this.resizingColumnElement = null;
        this.movingColumnElement = null;
        this.mouseX0 = 0;
        this.width0 = 0;
        this.left0 = 0;
        this.columnsWidth0 = [];

        this.list = document.createElement("div");
        this.list.className = "list-listbox";
        this.content.appendChild(this.list);

        this.listTitle = document.createElement("div");
        this.listTitle.className = "list-title";
        this.content.appendChild(this.listTitle);

        this.columnsOptions = document.createElement("div");
        this.columnsOptions.className = "list-columns-options";
        this.listTitle.appendChild(this.columnsOptions);
        this.columnsOptions.onclick = () => this.CustomizeColumns();

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

    LinkArray(array) {
        this.array = array;
    }

    FinalizeColumns() {
        this.resizingColumnElement = null;
        this.movingColumnElement = null;

        this.columnsElements = this.columnsElements.sort((a,b)=> a.offsetLeft - b.offsetLeft);
        for (let i = 0; i < this.columnsElements.length; i++) {
            this.columnsElements[i].style.transition = ".2s";
            this.columnsElements[i].style.zIndex = "0";
            this.columnsElements[i].style.cursor = "inherit";

            let x = 0;
            for (let j = 0; j < i; j++) {
                x += this.columnsElements[j].offsetWidth;
            }

            this.columnsElements[i].style.left = `${100 * x / this.listTitle.offsetWidth}%`;
            this.columnsElements[i].style.width = `${100 * this.columnsElements[i].offsetWidth / this.listTitle.offsetWidth}%`;
        }
    };

    SetColumns(columns) {
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
                event.target.style.transition = "0s";
                event.target.style.zIndex = "1";
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
            console.log("TODO: sort by " + event.target.textContent);
            //TODO: sort
        };

        for (let i = 0; i < columns.length; i++) {
            const newColumn = document.createElement("div");

            newColumn.style.left = `${100 * i / columns.length}%`;
            newColumn.style.width = `${100 / columns.length}%`;

            newColumn.onmousedown = event => Column_onmousedown(event);
            newColumn.onmousemove = event => Column_onmousemove(event);
            newColumn.onmouseup = event => Column_onmouseup(event);

            newColumn.innerHTML = `&nbsp;${columns[i]}`;
            this.columnsElements.push(newColumn);
            this.listTitle.appendChild(newColumn);
        }

        this.listTitle.appendChild(this.columnsOptions);
        
        setTimeout(()=>{this.FinalizeColumns()}, 400);

        this.AfterResize();
    }

    RefreshList() {
        this.view = [];
        this.list.innerHTML = "";

    }

    CustomizeColumns() {
        const dialog = this.DialogBox("320px");
        if (dialog === null) return;

        const btnOK = dialog.btnOK;
        const btnCancel = dialog.btnCancel;
        const buttonBox = dialog.buttonBox;
        const innerBox = dialog.innerBox;

        const btnApplyAll = document.createElement("input");
        btnApplyAll.type = "button";
        btnApplyAll.value = "Apply to all";
        buttonBox.appendChild(btnApplyAll);

        btnOK.value = "Apply";
        buttonBox.appendChild(btnOK);

        buttonBox.appendChild(btnCancel);
    }

    InflateElement(element, entry, c_type) { //overridable
        element.onclick = () => {
            if (this.selected)
                this.selected.style.backgroundColor = "";

            this.selected = element;
            element.style.backgroundColor = "var(--select-color)";
        };
    }

    UpdateViewport() {

    }

    AfterResize() { //override
        this.UpdateViewport();
    }

    Popout() { //override
        super.Popout();
        this.popoutWindow.addEventListener("mouseup", event => { this.List_mouseup(event); });
        this.popoutWindow.addEventListener("mousemove", event=> { this.List_mousemove(event); });
    }
}