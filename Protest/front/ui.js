const UI = {
    lastActivity: Date.now(),

    Initialize : ()=> {
        //set clock
        for (let i = 0; i < 12; i++) {
            const newDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            newDot.setAttribute("r", i%3==0 ? 2.5 : 1.5);
            newDot.setAttribute("cx", 48 + Math.sin(i*30/57.29577951)*36);
            newDot.setAttribute("cy", 48 - Math.cos(i*30/57.29577951)*36);
            newDot.setAttribute("fill", "var(--fore-color)");
            analog_clock.appendChild(newDot);
        }

        //automatically disable animations if prefers-reduced-motion
        if (window.matchMedia('(prefers-reduced-motion)').matches && localStorage.getItem("animations") === null)
            localStorage.setItem("animations", "false");

        WIN.always_maxxed       = localStorage.getItem("w_always_maxed") === "true";
        container.className     = localStorage.getItem("w_dropshadow") !== "false" ? "" : "disable-window-dropshadows";
        document.body.className = localStorage.getItem("animations") !== "false" ? "" : "disable-animations";

        if (localStorage.getItem("accent_color"))
            UI.SetAccentColor(localStorage.getItem("accent_color").split(",").map(o => parseInt(o)));
        else
            UI.SetAccentColor([255, 102, 0]);

        const pos = JSON.parse(localStorage.getItem("menu_button_pos"));
        if (pos) {
            menubutton.style.borderRadius = pos.borderRadius;
            menubutton.style.left = pos.left;
            menubutton.style.top = pos.top;
            menubutton.style.width = pos.width;
            menubutton.style.height = pos.height;
            
            const logo = menubutton.children[0];
            logo.style.left = pos.l_left;
            logo.style.top = pos.l_top;
            logo.style.width = pos.l_width;
            logo.style.height = pos.l_height;
        }
    },

    RgbToHsl : color=> {
        let r = color[0] / 255;
        let g = color[1] / 255;
        let b = color[2] / 255;
    
        let cmin = Math.min(r, g, b);
        let cmax = Math.max(r, g, b);
        let delta = cmax - cmin;
    
        let h, s, l;
    
        if (delta == 0) h = 0;
        else if (cmax == r) h = ((g - b) / delta) % 6;
        else if (cmax == g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
    
        h = Math.round(h * 60);
    
        if (h < 0) h += 360;
    
        l = (cmax + cmin) / 2;
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s*100).toFixed(1);
        l = +(l*100).toFixed(1);
    
        return [h, s, l];
    },

    SetAccentColor : accent=> {
        let rgbString = `rgb(${accent[0]},${accent[1]},${accent[2]})`;
        let hsl = UI.RgbToHsl(accent);
    
        let step1 = `hsl(${hsl[0]-4},${hsl[1]}%,${hsl[2]*.78}%)`;
        let step2 = `hsl(${hsl[0]+7},${hsl[1]}%,${hsl[2]*.9}%)`; //--select-color
        let step3 = `hsl(${hsl[0]-4},${hsl[1]}%,${hsl[2]*.8}%)`;
        let gradient = `linear-gradient(to bottom, ${step1}0%, ${step2}92%, ${step3}100%)`;
    
        let root = document.documentElement;
        root.style.setProperty("--theme-color", rgbString);
        root.style.setProperty("--select-color", step2);
        root.style.setProperty("--toolbar-bg", gradient);
        root.style.setProperty("--toolbar-bg-rev", `linear-gradient(to bottom, ${step3}0%, ${step2}2%, ${step1}100%)`);
    
        let ico = "<svg version=\"1.1\" xmlns:serif=\"http://www.serif.com/\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"48px\" height=\"48px\"  viewBox=\"0 0 48 48\" enable-background=\"new 0 0 48 48\" xml:space=\"preserve\">"+
            "<g fill=\""+step2+"\">"+
            "<path d=\"M26.935,0.837h7.491l0.624,14.984l-8.24,1.873L26.935,0.837z\"/>"+
            "<path d=\"M38.172,19.068l-3.871,8.866l-22.974,9.489l0.125-8.44l13.412-2.299V15.821L1.712,20.566l1.998,26.221 l42.579,0.375l-0.249-30.466L38.172,19.068z\"/>"+
            "<path d=\"M4.459,0.837l0.374,16.857l8.741-1.873l-0.5-14.984H4.459z\"/>"+
            "<path d=\"M15.821,0.837h7.304L24,13.2l-8.054,1.498L15.821,0.837z\"/>"+
            "<path d=\"M37.672,0.837h7.367l1.249,12.986l-8.491,1.998L37.672,0.837z\"/>"+
            "</g></svg>";
    
        favicon.href = "data:image/svg+xml;base64," + btoa(ico);
    }
};

const MENU = {
    isOpen       : false,
    isDragging   : false,
    isMoved      : false,
    position     : [0, 0],
    index        : -1,
    list         : [],
    altPress     : 0,
    lastAltPress : 0,

    Clear: ()=> {
        if (searchboxinput.value.length > 0) {
            searchboxinput.value = "";
            MENU.Update("");
        } else
        MENU.Close();
    },

    Open: ()=> {
        MENU.isOpen = true;
        MENU.UpdatePosition();
    
        if (MENU.isOpen) {
            setTimeout(() => { searchboxinput.focus(); }, 150);
        }
    },

    Close: ()=> {
        MENU.isOpen = false;
        MENU.UpdatePosition();
        
        MENU.session = [];
    },

    Toogle: ()=> {
        MENU.isOpen = !MENU.isOpen;
        MENU.UpdatePosition();
    
        if (MENU.isOpen) {
            setTimeout(() => { searchboxinput.focus(); }, 150);
        }
    },

    Update: (filter)=> {
        //TODO: 
    },

    UpdatePosition: ()=> {
        menubox.style.visibility = MENU.isOpen ? "visible" : "hidden";
        cap.style.visibility = MENU.isOpen ? "visible" : "hidden";
    
        let left = menubutton.style.left ? parseInt(menubutton.style.left) : 0;
    
        if (left < 10) {
            menubox.style.left = "20px";
            menubox.style.top = "20px";
            menubox.style.bottom = "20px";
            menubox.style.transform = MENU.isOpen ? "none" : "translateX(calc(-100% - 24px))";
    
        } else if (menubutton.style.left == "calc(100% - 48px)" || left > 90) {
            menubox.style.left = "calc(100% - var(--sidemenu-width) - 20px)";
            menubox.style.top = "20px";
            menubox.style.bottom = "20px";
            menubox.style.transform = MENU.isOpen ? "none" : "translateX(100%)";
    
        } else {
            menubox.style.left = `max(20px, min(calc(${left}% - var(--sidemenu-width) / 2) + 32px, calc(100% - var(--sidemenu-width) - 20px)))`;
    
            if (menubutton.style.top == "0px") {
                menubox.style.top = "20px";
                menubox.style.bottom = window.innerHeight > 640 ? "25%" : "20px";
                menubox.style.transform = MENU.isOpen ? "none" : "translateY(-100%)";
            } else {
                menubox.style.top = window.innerHeight > 640 ? "25%" : "20px";
                menubox.style.bottom = "20px";
                menubox.style.transform = MENU.isOpen ? "none" : "translateY(100%)";
            }
        }
    },

    StorePosition: ()=> {
        const logo = menubutton.children[0];
        localStorage.setItem("menu_button_pos", JSON.stringify({
            borderRadius: menubutton.style.borderRadius,
            left: menubutton.style.left,
            top: menubutton.style.top,
            width: menubutton.style.width,
            height: menubutton.style.height,
            l_left: logo.style.left,
            l_top: logo.style.top,
            l_width: logo.style.width,
            l_height: logo.style.height
        }));
    }
};

window.addEventListener("mousedown", () => {
    UI.lastActivity = Date.now();
});

window.addEventListener("keydown", () => {
    UI.lastActivity = Date.now();
});

window.addEventListener("resize", event=>{
    MENU.UpdatePosition();
});

document.body.addEventListener("mousemove", event => {
    if (event.buttons != 1) {
        if (MENU.isDragging) MENU.StorePosition();
        MENU.isDragging = false;
    }

    if (!MENU.isDragging) return;

    //ignore if move is less than 2px
    if (Math.abs(MENU.position[0] - event.clientX) > 2 || Math.abs(MENU.position[1] - event.clientY) > 2) {
        MENU.isMoved = true;
    }

    const logo = menubutton.children[0];

    let px = event.x / container.clientWidth;
    let py = event.y / container.clientHeight;

    if (event.x < 56 && event.y < 56) {
        menubutton.style.borderRadius = "4px 8px 48px 8px";
        menubutton.style.left = "0px";
        menubutton.style.top = "0px";
        menubutton.style.width = "48px";
        menubutton.style.height = "48px";

        logo.style.left = "8px";
        logo.style.top = "6px";
        logo.style.width = "26px";
        logo.style.height = "26px";

    } else if (event.x < 56 && event.y > container.clientHeight - 48) {
        menubutton.style.borderRadius = "8px 48px 8px 4px";
        menubutton.style.left = "0px";
        menubutton.style.top = "calc(100% - 48px)";
        menubutton.style.width = "48px";
        menubutton.style.height = "48px";

        logo.style.left = "8px";
        logo.style.top = "16px";
        logo.style.width = "26px";
        logo.style.height = "26px";

    } else if (event.x > container.clientWidth - 48 && event.y < 56) {
        menubutton.style.borderRadius = "8px 4px 8px 64px";
        menubutton.style.left = "calc(100% - 48px)";
        menubutton.style.top = "0px";
        menubutton.style.width = "48px";
        menubutton.style.height = "48px";

        logo.style.left = "16px";
        logo.style.top = "6px";
        logo.style.width = "26px";
        logo.style.height = "26px";

    } else if (event.x > container.clientWidth - 48 && event.y > container.clientHeight - 48) {
        menubutton.style.borderRadius = "64px 8px 4px 8px";
        menubutton.style.left = "calc(100% - 48px)";
        menubutton.style.top = "calc(100% - 48px)";
        menubutton.style.width = "48px";
        menubutton.style.height = "48px";

        logo.style.left = "16px";
        logo.style.top = "16px";
        logo.style.width = "26px";
        logo.style.height = "26px";

    } else if (px < py && 1 - px > py) { //left
        let y = 100 * (event.y - 32) / container.clientHeight;

        menubutton.style.borderRadius = "14px 40px 40px 14px";
        menubutton.style.left = "0px";
        menubutton.style.top = `${y}%`;
        menubutton.style.width = "48px";
        menubutton.style.height = "64px";

        logo.style.left = "8px";
        logo.style.top = "18px";
        logo.style.width = "28px";
        logo.style.height = "28px";

    } else if (px > py && 1 - px > py) { //top
        let x = 100 * (event.x - 32) / container.clientWidth;

        menubutton.style.borderRadius = "14px 14px 40px 40px";
        menubutton.style.left = `${x}%`;
        menubutton.style.top = "0px";
        menubutton.style.width = "64px";
        menubutton.style.height = "48px";

        logo.style.left = "19px";
        logo.style.top = "6px";
        logo.style.width = "28px";
        logo.style.height = "28px";

    } else if (px < py && 1 - px < py) { //bottom
        let x = 100 * (event.x - 32) / container.clientWidth;

        menubutton.style.borderRadius = "40px 40px 14px 14px";
        menubutton.style.left = `${x}%`;
        menubutton.style.top = "calc(100% - 48px)";
        menubutton.style.width = "64px";
        menubutton.style.height = "48px";

        logo.style.left = "19px";
        logo.style.top = "16px";
        logo.style.width = "28px";
        logo.style.height = "28px";

    } else if (px > py && 1 - px < py) { //right
        let y = 100 * (event.y - 32) / container.clientHeight;

        menubutton.style.borderRadius = "40px 14px 14px 40px";
        menubutton.style.left = "calc(100% - 48px)";
        menubutton.style.top = `${y}%`;
        menubutton.style.width = "48px";
        menubutton.style.height = "64px";

        logo.style.left = "14px";
        logo.style.top = "18px";
        logo.style.width = "28px";
        logo.style.height = "28px";
    }

    MENU.UpdatePosition();
});

document.body.addEventListener("mouseup", event => {
    if (MENU.isMoved) {
        MENU.StorePosition();
    }

    MENU.isDragging = false;
    setTimeout(() => {
        MENU.isMoved = false;
    }, 0);
});

document.body.addEventListener("keyup", event => {
    if (event.code == "AltLeft") {
        event.preventDefault();

        if (Date.now() - MENU.lastAltPress < 250) {
            MENU.lastAltPress = 0;
            MENU.Toogle();
        } else {
            MENU.lastAltPress = Date.now();
        }
    } else {
        MENU.lastAltPress = 0;
    }
});

menubutton.onclick = event => {
    if (MENU.isMoved) return;
    if (event.button == 0) MENU.Toogle();
};

menubutton.onmousedown = event => {
    MENU.position = [event.clientX, event.clientY];
    MENU.isDragging = true;
    event.stopPropagation();
};

searchbox.onclick = event => { searchboxinput.focus(); };

searchboxinput.onclick = event => { event.stopPropagation(); };

searchboxinput.onkeydown = event => {
    switch (event.keyCode) {
        case 27: //esc
            event.stopPropagation();
            MENU.Clear();
            break;

        case 13: //enter
            if (event.ctrlKey) {
                MENU.list[MENU.index].onmousedown(null);
                searchboxinput.focus();
                setTimeout(searchboxinput.focus(), 10);
            } else {
                if (MENU.index > -1)
                    MENU.list[MENU.index].onclick(event);
            }
            break;

        case 38: //up
            event.preventDefault();
            if (MENU.list.length > 0) {
                if (MENU.index > -1) MENU.list[MENU.index].style.backgroundColor = "rgb(208,208,208)";
                MENU.index--;
                if (MENU.index < 0) MENU.index = MENU.list.length - 1;
                if (MENU.index > -1) MENU.list[MENU.index].style.backgroundColor = "var(--select-color)";
            }
            break;

        case 40: //down
            event.preventDefault();
            if (MENU.list.length > 0) {
                if (MENU.index > -1) MENU.list[MENU.index].style.backgroundColor = "rgb(208,208,208)";
                MENU.index++;
                if (MENU.index >= MENU.list.length) MENU.index = 0;
                MENU.list[MENU.index].style.backgroundColor = "var(--select-color)";
            }
            break;
    }

    if (MENU.list.length > 0 && (event.keyCode == 38 || event.keyCode == 40)) //scroll into view
        MENU.list[MENU.index].scrollIntoView({ behavior: "smooth", block: "center" });
};

clearmenusearch.onclick = event => {
    event.stopPropagation();
    MENU.Clear();
};

cap.onclick = () => { MENU.Close(); };

btnLogout.onclick = async ()=> {
    MENU.Close();

    await fetch("/logout")
    .then(response => {
        if (response.status == 200) {
            location.reload();
        } else {
            console.error(response.text());
        }
    })
    .catch(error =>{
        console.error(error);
    });
}

btnSettings.onclick = () => {
    MENU.Close();
    new Settings();
};

(function minuteLoop() {
    //check session
    const timeMapping = { 1:15, 2:30, 3:60, 4:2*60, 5:4*60, 6:8*60, 7:24*60, 8:Infinity};
    const index = localStorage.getItem("session_timeout") == null ? 1 : parseInt(localStorage.getItem("session_timeout"));

    if ((Date.now() - UI.lastActivity) > 60 * 1000 * timeMapping[index]) {
        fetch("/logout")
        .then(response => { if (response.status === 200) location.reload(); });
    }

    //update clock
    const now = new Date();
    const m = now.getMinutes();
    const h = (now.getHours() % 12) + m / 60;

    analog_clock_m.style.transform = "rotate(" + m * 6 + "deg)";
    analog_clock_h.style.transform = "rotate(" + h * 30 + "deg)";

    date_month.textContent = now.toLocaleDateString(undefined, {month:"short"}).toUpperCase();
    date_date.textContent = now.getDate();
    date_day.textContent = now.toLocaleDateString(undefined, {weekday:"long"});

    setTimeout(() => minuteLoop(), 60000);
})();

