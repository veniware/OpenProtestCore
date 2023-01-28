const ANIM_DURATION = 200;
const onMobile = (/Android|webOS|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent));

const WIN = {
    array: [],
    active:  null,
    focused: null,
    iconSize: onMobile ? 48 : 56,
    isMoving:         false,
    isResizing:       false,
    isIcoMoving:      false,
    isControlPressed: false,
    x0:      0,
    y0:      0,
    offsetX: 0,
    offsetY: 0,
    startX:  10,
    startY:  10,
    count:   0,
    always_maxxed: false,

    AlignIcon: (ignoreActive)=> {
        let max = onMobile ? 48 : 56;
        WIN.iconSize = (container.clientWidth / (WIN.array.length) > max) ? max : container.clientWidth / WIN.array.length;
    
        for (let i = 0; i < WIN.array.length; i++) {
            WIN.array[i].task.style.width = (WIN.iconSize-4) + "px";
            WIN.array[i].task.style.height = (WIN.iconSize-4) + "px";
        }
    
        taskbar.style.height = (WIN.iconSize) + "px";
        container.style.bottom = (WIN.iconSize) + "px";
    
        WIN.array = WIN.array.sort((a,b)=> a.task.offsetLeft - b.task.offsetLeft);
    
        if (ignoreActive) {
            for (let i=0; i<WIN.array.length; i++)
                if (WIN.array[i].task != WIN.active.task) {
                    WIN.array[i].task.style.transition = ANIM_DURATION/1000 + "s";
                    WIN.array[i].task.style.left = 2 + i * WIN.iconSize + "px";
                }
        } else {
            for (let i=0; i<WIN.array.length; i++) {
                WIN.array[i].task.style.transition = ANIM_DURATION/1000 + "s";
                WIN.array[i].task.style.left = 2 + i * WIN.iconSize + "px";
            }

            setTimeout(()=> {
                for (let i=0; i<WIN.array.length; i++) WIN.array[i].task.style.transition = "0s";
            }, ANIM_DURATION);
        }
    }
};

document.body.onresize = (event)=> {
    document.getSelection().removeAllRanges();
    WIN.AlignIcon(false);

    for (let i=0; i<WIN.array.length; i++) {
        WIN.array[i].AfterResize();
        if (WIN.array[i].InvalidateRecyclerList) WIN.array[i].InvalidateRecyclerList();
    }
};

document.body.onmousemove = (event)=> {
    if (WIN.active === null) return;

    if (event.buttons != 1) document.body.onmouseup(event);

    document.getSelection().removeAllRanges(); //remove all selections

    if (WIN.isMoving) {
        if (WIN.active.isMaximized && event.clientY < 64) return;

        if (WIN.active.isMaximized) {
            WIN.active.Toogle();
        }

        let x = (WIN.offsetX - (WIN.x0 - event.clientX)) * 100 / container.clientWidth;
        WIN.active.win.style.left = Math.min(100 - WIN.active.win.clientWidth * 100 / container.clientWidth, Math.max(0, x)) + "%";

        let y = (WIN.offsetY - (WIN.y0 - event.clientY)) * 100 / container.clientHeight;
        y = Math.min(100 - WIN.active.win.clientHeight * 100 / container.clientHeight, Math.max(0, y));
        WIN.active.win.style.top = ((y < 0) ? 0 : y) + "%";

    } else if (WIN.isResizing) {
        let w = (WIN.offsetX - (WIN.x0 - event.clientX)) * 100 / container.clientWidth;
        let h = (WIN.offsetY - (WIN.y0 - event.clientY)) * 100 / container.clientHeight;
        WIN.active.win.style.width = Math.min(100 - WIN.active.win.offsetLeft * 100 / container.clientWidth, w) + "%";
        WIN.active.win.style.height = Math.min(100 - WIN.active.win.offsetTop * 100 / container.clientHeight, h) + "%";

        WIN.active.AfterResize();

    } else if (WIN.isIcoMoving) {
        let x = WIN.offsetX - (WIN.x0 - event.clientX);
        x = Math.max(0, x);
        x = Math.min(taskbar.clientWidth - WIN.active.task.clientWidth, x);
        WIN.active.task.style.left = x + "px";
        WIN.AlignIcon(true);
    }
};

document.body.onmouseup = (event)=> {
    //if (!WIN.isMoving && !WIN.isResizing) return;

    if (WIN.active != null) {
        WIN.active.task.style.transition = ANIM_DURATION/1000 + "s";
        WIN.active.task.style.zIndex = "3";
        WIN.AlignIcon(false);
    }

    WIN.isMoving = false;
    WIN.isResizing = false;
    WIN.isIcoMoving = false;
    WIN.active = null;
    //event.stopPropagation();
};

document.body.onkeydown = (event)=> {
    if (event.keyCode == 27) { //esc
        if (WIN.focused === null) return;
        if (WIN.focused.escAction === null) return;
        WIN.focused.escAction();
    }
};

document.body.onbeforeunload = () => {
    LOADER.StoreSession();

    for (let i = 0; i < WIN.array.length; i++)
        if (WIN.array[i].popoutWindow)
            WIN.array[i].popoutWindow.close();

    if (localStorage.getItem("alive_after_close") != "true") {
        fetch("/logout");
    }
};

class Window {
    constructor(themeColor = [64,64,64]) {
        this.isMaximized     = false;
        this.isMinimized     = false;
        this.isClosed        = false;
        this.themeColor      = themeColor;
        this.position        = null;
        this.escAction       = null;
        this.defaultElement  = null;
        this.params          = {};
        this.messagesQueue   = [];
        this.cssDependencies = [];
        this.toolbar         = null;

        WIN.startX += 2;
        WIN.startY += 6;
        if (WIN.startY >= 40) {
            WIN.startY = 4;
            WIN.startX -= 10;
        }
        if (WIN.startX >= 40) {
            WIN.startY = 10;
            WIN.startX = 10;
        }

        this.win = document.createElement("div");
        this.win.style.left   = WIN.startX + "%";
        this.win.style.top    = WIN.startY + "%";
        this.win.style.width  = "50%";
        this.win.style.height = "60%";
        this.win.style.zIndex = ++WIN.count;
        this.win.className    = "window";
        container.appendChild(this.win);

        this.task = document.createElement("div");
        this.task.setAttribute("role", "button");
        this.task.tabIndex = "0";
        this.task.className = "bar-icon";
        this.task.style.left = 2 + WIN.array.length * (onMobile ? 48 : 56) + "px";
        taskbar.appendChild(this.task);

        this.icon = document.createElement("div");
        this.icon.className = "icon";
        this.task.appendChild(this.icon);

        this.content = document.createElement("div");
        this.content.className = "win-content";
        this.win.appendChild(this.content);

        this.lblTitle = document.createElement("div");
        this.lblTitle.className = "title";
        this.win.appendChild(this.lblTitle);

        this.titleicon = document.createElement("div");
        this.titleicon.className = "titleicon";
        this.win.appendChild(this.titleicon);
        
        this.resize = document.createElement("div");
        this.resize.className = "resize";
        this.win.appendChild(this.resize);

        this.btnClose = document.createElement("div");
        this.btnClose.className = "control close-box";
        this.win.appendChild(this.btnClose);
        if (onMobile) {
            this.btnClose.style.width = this.btnClose.style.height = "28px";
            this.btnClose.style.backgroundSize = "26px";
            this.btnClose.style.backgroundPosition = "1px 1px";
        }

        this.btnMaximize = document.createElement("div");
        if (!onMobile) {
            this.btnMaximize.className = "control maximize-box";
            this.win.appendChild(this.btnMaximize);
        }

        this.btnMinimize = document.createElement("div");
        if (!onMobile) {
            this.btnMinimize.className = "control minimize-box";
            this.win.appendChild(this.btnMinimize);
        }

        this.btnPopout = document.createElement("div");
        if (!onMobile) {
            this.btnPopout.className = "control popout-box";
            this.win.appendChild(this.btnPopout);
        }
        
        let dblclickCheck = false;
        this.win.onmousedown = (event)=> {

            if (!this.popoutWindow)
                this.BringToFront();
            
            if (event.button == 0 && event.offsetY < 32) { //left click on title bar
                WIN.offsetX  = this.win.offsetLeft;
                WIN.offsetY  = this.win.offsetTop;
                WIN.x0       = event.clientX;
                WIN.y0       = event.clientY;
                WIN.isMoving = true;

                this.win.style.transition = "0s";

                if (dblclickCheck && !onMobile) {
                    this.Toogle();
                    dblclickCheck = false;
                    return;
                }
                dblclickCheck = true;
                setTimeout(()=> { dblclickCheck = false; }, 333);
            }
            WIN.active = this;
            WIN.focused = this;
        };

        this.resize.onmousedown = (event)=> {
            this.BringToFront();
            if (event.button == 0) { //left click
                WIN.offsetX  = this.win.clientWidth;
                WIN.offsetY  = this.win.clientHeight;
                WIN.x0 = event.clientX;
                WIN.y0 = event.clientY;
                WIN.isResizing = true;
                WIN.active = this;
            }
            event.stopPropagation();
        };

        let icoPosition = 0;
        this.task.onmousedown = (event)=> {
            if (event.button == 0) { //left click
                icoPosition = this.task.offsetLeft;

                this.task.style.zIndex = "5";
                WIN.offsetX  = this.task.offsetLeft;
                WIN.x0 = event.clientX;
                WIN.isIcoMoving = true;
                WIN.active = this;
            }
        };

        this.task.onmouseup = (event)=> {
            if (event.button == 0 && (Math.abs(icoPosition - this.task.offsetLeft) < 2)) { //clicked but not moved
                if (this.popoutWindow) 
                    this.popoutWindow.focus();
               
                this.Minimize();
                if (!this.isMinimized) if (this.defaultElement != null) this.defaultElement.focus();
            }

            if (event.button==1) { //close on middle click
                this.Close();
                event.preventDefault();
            }
        };
        
        this.content.onmousedown = (event)=> {
            if (!this.popoutWindow)
                this.BringToFront();

            event.stopPropagation();
        };

        this.btnClose.onmousedown =
        this.btnMaximize.onmousedown =
        this.btnMinimize.onmousedown =
        this.btnPopout.onmousedown =
        (event)=> {
            WIN.control_pressed = this;
            this.BringToFront();
            event.stopPropagation();
        };
        
        this.btnClose.onmouseup    = (event)=> { if (event.button==0 && WIN.control_pressed==this) {WIN.control_pressed=null; this.Close();} };
        this.btnMaximize.onmouseup = (event)=> { if (event.button==0 && WIN.control_pressed==this) {WIN.control_pressed=null; this.Toogle();} };
        this.btnMinimize.onmouseup = (event)=> { if (event.button==0 && WIN.control_pressed==this) {WIN.control_pressed=null; this.Minimize();} };
        this.btnPopout.onmouseup   = (event)=> { if (event.button==0 && WIN.control_pressed==this) {WIN.control_pressed=null; this.Popout();} };
    
        this.SetTitle("[untitled]");
        WIN.array.push(this);

        //this.SetThemeColor(this.themeColor);
        this.BringToFront();

        WIN.AlignIcon(false);

        if (onMobile || WIN.always_maxxed) this.Toogle();
    }

    InitializeToolbar() {
        this.toolbar = document.createElement("div");
        this.toolbar.className = "win-toolbar";
        this.win.appendChild(this.toolbar);

        if (this.isMaximized) {
            this.toolbar.style.top = "38px";
            this.content.style.top = "82px";
        } else {
            this.toolbar.style.top = "32px";
            this.content.style.top = "76px";
        }

        this.toolbar.onmousedown = (event)=> {
            if (!this.popoutWindow)
                this.BringToFront();
            event.stopPropagation(); };
    }

    Close() {
        if (this.isClosed) return;
        this.isClosed = true;

        document.getSelection().removeAllRanges();

        this.win.style.transition = ANIM_DURATION/1333 + "s";
        this.win.style.opacity    = "0";
        this.win.style.transform  = "scale(.85)";

        this.task.style.transition = ANIM_DURATION/2000 + "s";
        this.task.style.opacity    = "0";
        this.task.style.transform  = "scale(.85)";

        setTimeout(()=> {
            if (this.popoutWindow)
                this.popoutWindow.close();
            else
                container.removeChild(this.win);

                taskbar.removeChild(this.task);
            WIN.array.splice(WIN.array.indexOf(this), 1);
            WIN.AlignIcon(false);
        }, ANIM_DURATION/2);

        WIN.focused = null;
    }

    Toogle() {
        document.getSelection().removeAllRanges();

        this.win.style.transition = ANIM_DURATION/1000 + "s";

        if (this.isMaximized) {
            if (this.position==null) {
                this.win.style.left   = "20%";
                this.win.style.top    = "20%";
                this.win.style.width  = "40%";
                this.win.style.height = "40%";
            } else {
                this.win.style.left   = this.position[0];
                this.win.style.top    = this.position[1];
                this.win.style.width  = this.position[2];
                this.win.style.height = this.position[3];
            }

            this.content.style.left      = "4px";
            this.content.style.right     = "4px";
            this.content.style.top       = this.toolbar ? "76px" : "32px";
            this.content.style.bottom    = "4px";

            this.win.style.borderRadius  = "8px 8px 0 0";
            this.resize.style.visibility = "visible";
            this.isMaximized = false;

            this.task.style.top = "2px";
            this.task.style.borderRadius = "8%";

            if (this.toolbar && !this.popoutWindow) {
                this.toolbar.style.top = "32px";
            }

        } else {
            this.position = [this.win.style.left, this.win.style.top, this.win.style.width, this.win.style.height];
            this.win.style.left          = "0%";
            this.win.style.top           = "0%";
            this.win.style.width         = "100%";
            this.win.style.height        = "100%";

            this.content.style.left      = "0";
            this.content.style.right     = "0";
            this.content.style.top       = this.toolbar ? "82px" : "38px";
            this.content.style.bottom    = "0";

            this.win.style.borderRadius  = "0";
            this.resize.style.visibility = "hidden";
            this.isMaximized = true;

            this.task.style.top = "0";
            this.task.style.borderRadius = "0 0 8% 8%";

            if (this.toolbar) {
                this.toolbar.style.top = "38px";
            }
        }

        setTimeout(()=> {
            this.win.style.transition = "0s";
            this.AfterResize();
        }, ANIM_DURATION);
    }

    Minimize(force) {
        document.getSelection().removeAllRanges();

        let isFocused = (WIN.count == this.win.style.zIndex);
        this.win.style.transition = ".3s";

        if (this.isMinimized && !force) { //restore
            this.win.style.opacity    = "1";
            this.win.style.visibility = "visible";
            this.win.style.transform  = "none";
            this.isMinimized = false;
            setTimeout(()=> { this.BringToFront(); }, ANIM_DURATION/2);

            WIN.focused = this;

        } else if (!isFocused && !force) { //pop
            this.Pop();

        } else { //minimize
            if (this.popoutWindow) return;

            let iconPosition = this.task.getBoundingClientRect().x - this.win.offsetLeft - this.win.clientWidth/2;

            this.win.style.opacity    = "0";
            this.win.style.visibility = "hidden";
            this.win.style.transform  = "scale(.6) translateX(" + iconPosition + "px) translateY(" + container.clientHeight + "px)";
            this.isMinimized = true;

            this.task.style.top = "2px";
            this.task.style.borderRadius = "8%";
            this.task.className = "bar-icon";

            WIN.focused = null;
        }

        setTimeout(()=> { this.win.style.transition = "0s"; }, ANIM_DURATION);
    }

    Pop() {
        if (this.isMinimized) {
            this.Minimize(); //minimize/restore
        } else {
            if (!this.isMaximized) this.win.style.animation = "focus-pop .2s";
            this.BringToFront();
            setTimeout(()=> { this.win.style.animation = "none" }, 200);
        }
    }

    Popout() {
        document.getSelection().removeAllRanges();

        //close any open dialog box
        const dialog = this.win.getElementsByClassName("win-dim")[0];
        if (dialog != null) {
            this.win.removeChild(dialog);
            this.content.style.filter = "none";
        }

        let newWin = window.open(
            "", "",
            `width=${this.win.clientWidth},height=${this.win.clientHeight},left=${window.screenX+this.win.offsetLeft},top=${window.screenY+this.win.offsetTop}`);

        newWin.document.write(`<html><head><title>${this.lblTitle.textContent}</title>`);
        newWin.document.write("<link rel='icon' href='mono/icon24.png'>");
        newWin.document.write("<link rel='stylesheet' href='root.css'>");

        for (let i = 0; i < LOADER.baseStyles.length; i++)
            newWin.document.write(`<link rel='stylesheet' href='${LOADER.baseStyles[i]}'>`);

        for (let i = 0; i < this.cssDependencies.length; i++)
            newWin.document.write(`<link rel='stylesheet' href='${this.cssDependencies[i]}'>`);

        newWin.document.write("</head><body>");
        newWin.document.write("</body></html>");
        newWin.document.close();

        newWin.document.body.style.backgroundColor = `rgb(${this.themeColor[0]},${this.themeColor[1]},${this.themeColor[2]})`;
        newWin.document.body.style.padding = "0";
        newWin.document.body.style.margin = "0";
        if ((this.themeColor[0] + this.themeColor[1] + this.themeColor[2]) / 3 < 128) newWin.document.body.style.color = "rgb(224,224,224)";

        if (localStorage.getItem("accent_color")) { //apply accent color
            let accent = localStorage.getItem("accent_color").split(",").map(o => parseInt(o.trim()));
            let hsl = UI.RgbToHsl(accent);
            let select = `hsl(${hsl[0]+7},${hsl[1]}%,${hsl[2]*.9}%)`;
            newWin.document.querySelector(":root").style.setProperty("--theme-color", `rgb(${accent[0]},${accent[1]},${accent[2]})`);
            newWin.document.querySelector(":root").style.setProperty("--select-color", select);
        }

        this.popoutWindow = newWin;
        container.removeChild(this.win);

        const btnUnpop = document.createElement("input");
        btnUnpop.type = "button";
        btnUnpop.style.padding = "0";
        btnUnpop.style.margin = "0";
        btnUnpop.style.minWidth = "0";
        btnUnpop.style.position = "absolute";
        btnUnpop.style.width = this.toolbar ? "24px" : "22px";
        btnUnpop.style.height = this.toolbar ? "24px" : "22px";
        btnUnpop.style.right = "2px";
        btnUnpop.style.top = this.toolbar ? "8px" : "2px";
        btnUnpop.style.backgroundColor = "rgb(224,224,224)";
        btnUnpop.style.backgroundImage = "url(controls/popout.svg)";
        btnUnpop.style.backgroundPosition = "center";
        btnUnpop.style.borderRadius = "12px";

        this.content.style.left = "0";
        this.content.style.right = "0";
        this.content.style.top = this.toolbar ? "48px" : "26px";
        this.content.style.bottom = "0";
        newWin.document.body.appendChild(this.content);

        if (this.toolbar) {
            toolbar = this.toolbar;
            this.toolbar.style.top = "4px";
            newWin.document.body.appendChild(this.toolbar);
            this.toolbar.appendChild(btnUnpop);
        } else {
            newWin.document.body.appendChild(btnUnpop);
        }

        this.content.style.filter = "none";

        newWin.onresize = () => this.AfterResize();

        btnUnpop.onclick = () => {
            container.appendChild(this.win);
            this.win.appendChild(this.content);
            
            newWin.onbeforeunload = () => {};
            newWin.close();
            this.popoutWindow = null;

            this.content.style.filter = "none";
            
            this.content.style.left = this.isMaximized ? "0" : "4px";
            this.content.style.right = this.isMaximized ? "0" : "4px";
            this.content.style.top = this.isMaximized ? "38px" : "32px";
            this.content.style.bottom = this.isMaximized ? "0" : "4px";

            if (this.toolbar) {
                this.toolbar.removeChild(btnUnpop);
                this.win.appendChild(this.toolbar);
                this.toolbar.style.top = this.isMaximized ? "38px" : "32px";
                this.content.style.top = this.isMaximized ? "82px" : "76px";
            }

            this.AfterResize();
        };

        newWin.onbeforeunload = () => this.Close();

        return btnUnpop;
    }

    BringToFront() {
        if (this.win.style.zIndex != WIN.count && !document.getSelection().isCollapsed)
            document.getSelection().removeAllRanges();

        for (let i=0; i<WIN.array.length; i++) {
            WIN.array[i].task.style.top = "2px";
            WIN.array[i].task.style.borderRadius = "8%";
            WIN.array[i].task.style.backgroundColor = "rgba(0,0,0,0)";
            WIN.array[i].icon.style.filter = "none";

            WIN.array[i].task.className = "bar-icon";
        }

        this.task.className = "bar-icon bar-icon-focused";
        this.task.style.backgroundColor = `rgb(${this.themeColor[0]},${this.themeColor[1]},${this.themeColor[2]})`;
        if ((this.themeColor[0] + this.themeColor[1] + this.themeColor[2]) / 3 < 128) this.icon.style.filter = "brightness(6)";

        if (this.popoutWindow) {
            this.popoutWindow.focus();
            return;
        }

        if (this.isMaximized) {
            this.task.style.top = "0";
            this.task.style.borderRadius = "0 0 8% 8%";
        }

        if (this.win.style.zIndex < WIN.count) this.win.style.zIndex = ++WIN.count;

        WIN.focused = this;
    }

    ConfirmBox(message, okOnly = false) {
        //if a dialog is already opened, queue
        if (this.popoutWindow) {
            if (this.popoutWindow.document.body.getElementsByClassName("win-dim")[0] != null) {
                this.messagesQueue.push([message, okOnly]);
                return null;
            }
        } else {
            document.getSelection().removeAllRanges();
            if (this.win.getElementsByClassName("win-dim")[0] != null) {
                this.messagesQueue.push([message, okOnly]);
                return null;
            }
        }
        
        const dim = document.createElement("div");
        dim.className = "win-dim";

        if (this.popoutWindow)
            this.popoutWindow.document.body.appendChild(dim);
        else
            this.win.appendChild(dim);

        const confirmBox = document.createElement("div");
        confirmBox.className = "win-confirm";
        dim.appendChild(confirmBox);

        const lblMessage = document.createElement("div");
        lblMessage.textContent = message;
        confirmBox.appendChild(lblMessage);

        const buttonBox = document.createElement("div");
        buttonBox.style.paddingTop = "24px";
        confirmBox.appendChild(buttonBox);

        const btnOK = document.createElement("input");
        btnOK.type = "button";
        btnOK.value = "OK";
        buttonBox.appendChild(btnOK);

        const btnCancel = document.createElement("input");
        btnCancel.type = "button";
        btnCancel.value = "Cancel";
        if (!okOnly) buttonBox.appendChild(btnCancel);

        this.content.style.filter = "blur(4px)";

        dim.onmouseup = dim.onmousedown = event => {
            event.stopPropagation();
            this.BringToFront();
        };

        let once = false;
        btnCancel.onclick = event => {
            if (once) return;
            once = true;
            dim.style.filter = "opacity(0)";
            confirmBox.style.transform = "scaleY(.2)";
            this.content.style.filter = "none";
            setTimeout(() => {
                if (this.popoutWindow) 
                    this.popoutWindow.document.body.removeChild(dim);
                else
                    this.win.removeChild(dim);

                let next = this.messagesQueue.shift();
                if (next) this.ConfirmBox(next[0], next[1]);
            }, ANIM_DURATION);
        };

        btnOK.onclick = event => btnCancel.onclick(event);
        btnOK.focus();

        return btnOK;
    }

    DialogBox(height) {
        //if a dialog is already opened, do nothing
        if (this.popoutWindow) {
            if (this.popoutWindow.document.body.getElementsByClassName("win-dim")[0] != null) return null;
        } else {
            document.getSelection().removeAllRanges();
            if (this.win.getElementsByClassName("win-dim")[0] != null) return null;
        }

        const dim = document.createElement("div");
        dim.className = "win-dim";

        if (this.popoutWindow)
            this.popoutWindow.document.body.appendChild(dim);
        else
            this.win.appendChild(dim);

        const dialogBox = document.createElement("div");
        dialogBox.className = "win-dialog";
        dim.appendChild(dialogBox);
        if (height != undefined) {
            dialogBox.style.maxHeight = height;
            dialogBox.style.borderRadius = "0 0 8px 8px";
        }
        dim.appendChild(dialogBox);

        let innerBox = document.createElement("div");
        innerBox.style.position = "absolute";
        innerBox.style.left = "0";
        innerBox.style.right = "0";
        innerBox.style.top = "0";
        innerBox.style.bottom = "52px";
        innerBox.style.overflowY = "auto";
        dialogBox.appendChild(innerBox);

        const buttonBox = document.createElement("div");
        buttonBox.style.position = "absolute";
        buttonBox.style.textAlign = "center";
        buttonBox.style.left = "4px";
        buttonBox.style.right = "4px";
        buttonBox.style.bottom = "8px";
        dialogBox.appendChild(buttonBox);

        const btnOK = document.createElement("input");
        btnOK.type = "button";
        btnOK.value = "OK";
        buttonBox.appendChild(btnOK);

        const btnCancel = document.createElement("input");
        btnCancel.type = "button";
        btnCancel.value = "Cancel";
        buttonBox.appendChild(btnCancel);

        this.content.style.filter = "blur(4px)";

        dim.onmouseup = dim.onmousedown = event => {
            event.stopPropagation();
            this.BringToFront();
        };

        const Abort = () => {
            if (this.popoutWindow)
                this.popoutWindow.document.body.removeChild(dim);
            else
                this.win.removeChild(dim);
        };

        let once = false;
        btnCancel.onclick = event => {
            if (once) return;
            once = true;
            dim.style.filter = "opacity(0)";
            dialogBox.style.transform = "scaleY(.2)";
            this.content.style.filter = "none";
            setTimeout(() => {
                Abort();
            }, ANIM_DURATION);
        };

        btnOK.onclick = event => btnCancel.onclick(event);

        return {
            innerBox: innerBox,
            buttonBox: buttonBox,
            btnOK: btnOK,
            btnCancel: btnCancel,
            Abort: Abort
        };
    }

    SetTitle(title="") {
        this.lblTitle.textContent = title;
        this.task.setAttribute("tip", title);
    }
    
    SetIcon(icon) {
        this.icon.style.backgroundImage = "url(" + icon + ")";
        this.titleicon.style.backgroundImage = "url(" + icon + ")";
    }

    SetThemeColor(color) {
        this.themeColor = color;
        this.content.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;

        if ((this.themeColor[0]+this.themeColor[1]+this.themeColor[2]) / 3 > 127)
            this.content.style.color = "#202020";
    }

    AfterResize() { } //overridable

    AddCheckBoxLabel(parent, checkbox, label) {
        let id = Date.now() + Math.random() * 1000;
        checkbox.id = "id" + id;

        let newLabel = document.createElement("label");
        newLabel.textContent = label;
        newLabel.setAttribute("for", "id" + id);
        newLabel.setAttribute("tabindex", "0");
        newLabel.style.width = "80%";
        parent.appendChild(newLabel);

        newLabel.onkeydown = event=> {
            if (event.key == " " || event.key == "Enter") {
                checkbox.checked = !checkbox.checked;
                event.preventDefault();
                if (checkbox.onchange) checkbox.onchange();
            }
        };

        return newLabel;
    }

    AddCssDependencies(filename) {
        if (document.head.querySelectorAll(`link[href$='${filename}']`).length == 0) {
            let csslink = document.createElement("link");
            csslink.rel = "stylesheet";
            csslink.href = filename;
            document.head.appendChild(csslink);
        }

        if (this.cssDependencies.indexOf(filename) === -1)
            this.cssDependencies.push(filename);        
    }
}