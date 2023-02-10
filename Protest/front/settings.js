class Settings extends Tabs {
    constructor(params) {
        super(null);

        this.params = params ? params : "";

        this.SetTitle("Settings");
        this.SetIcon("mono/wrench.svg");

        this.params = params ? params : "";

        this.SetTitle("Settings");
        this.SetIcon("mono/wrench.svg");

        this.tabsContainer.style.width = "175px";
        this.subContent.style.left = "200px";
        this.subContent.style.padding = "24px";
        this.subContent.style.overflowY = "auto";

        this.tabGui     = this.AddTab("Appearance", "mono/tv.svg");
        this.tabRegion  = this.AddTab("Regional format", "mono/earth.svg" );
        this.tabSession = this.AddTab("Session", "mono/hourglass.svg");
        this.tabAbout   = this.AddTab("About", "mono/logo.svg");
        this.tabLegal   = this.AddTab("License", "mono/gpl.svg");

        this.tabGui.onclick     = () => this.ShowGui();
        this.tabRegion.onclick  = () => this.ShowRegion();
        this.tabSession.onclick = () => this.ShowSession();
        this.tabAbout.onclick   = () => this.ShowAbout();
        this.tabLegal.onclick   = () => this.ShowLegal();

        switch (this.params) {
            case "region":
                this.tabRegion.className = "v-tab-selected";
                this.ShowRegion();
                break;

            case "session":
                this.tabSession.className = "v-tab-selected";
                this.ShowSession();
                break;

            case "about":
                this.tabAbout.className = "v-tab-selected";
                this.ShowAbout();
                break;

            case "legal":
                this.tabLegal.className = "v-tab-selected";
                this.ShowLegal();
                break;

            default:
                this.tabGui.className = "v-tab-selected";
                this.ShowGui();
        }
    }

    ShowGui() {
        this.params = "appearance";
        this.subContent.innerHTML = "";

        this.chkWinMaxxed = document.createElement("input");
        this.chkWinMaxxed.type = "checkbox";
        this.subContent.appendChild(this.chkWinMaxxed);
        this.AddCheckBoxLabel(this.subContent, this.chkWinMaxxed, "Always maximize windows");
        this.subContent.appendChild(document.createElement("br"));
        this.subContent.appendChild(document.createElement("br"));

        this.chkAnimations = document.createElement("input");
        this.chkAnimations.type = "checkbox";
        this.subContent.appendChild(this.chkAnimations);
        this.AddCheckBoxLabel(this.subContent, this.chkAnimations, "Play animations");
        this.subContent.appendChild(document.createElement("br"));
        this.subContent.appendChild(document.createElement("br"));

        this.chkWindowShadows = document.createElement("input");
        this.chkWindowShadows.type = "checkbox";
        this.subContent.appendChild(this.chkWindowShadows);
        this.AddCheckBoxLabel(this.subContent, this.chkWindowShadows, "Show window drop-shadows");
        this.subContent.appendChild(document.createElement("br"));
        this.subContent.appendChild(document.createElement("br"));

        this.subContent.appendChild(document.createElement("hr"));

        const divColor = document.createElement("div");
        divColor.textContent = "Accent color: ";
        divColor.style.fontWeight = "600";
        divColor.style.paddingBottom = "8px";
        this.subContent.appendChild(divColor);

        this.accentIndicators = [];
        let selected_accent = [255, 102, 0];
        if (localStorage.getItem("accent_color"))
            selected_accent = localStorage.getItem("accent_color").split(",").map(o => parseInt(o));

        const accentColors = [[224,56,64], [255,102,0], [255,186,0], [96,192,32], [36,176,244]];

        for (let i = 0; i < accentColors.length; i++) {
            let rgbString = `rgb(${accentColors[i][0]},${accentColors[i][1]},${accentColors[i][2]})`;
            let hsl = UI.RgbToHsl(accentColors[i]);

            let step1 = `hsl(${hsl[0]-4},${hsl[1]}%,${hsl[2]*.78}%)`;
            let step2 = `hsl(${hsl[0]+7},${hsl[1]}%,${hsl[2]*.9}%)`; //--clr-select
            let step3 = `hsl(${hsl[0]-4},${hsl[1]}%,${hsl[2]*.8}%)`;
            let gradient = `linear-gradient(to bottom, ${step1}0%, ${step2}92%, ${step3}100%)`;

            const themeBox = document.createElement("div");
            themeBox.style.display = "inline-block";
            themeBox.style.margin = "2px 4px";
            this.subContent.appendChild(themeBox);

            const gradientBox = document.createElement("div");
            gradientBox.style.width = "48px";
            gradientBox.style.height = "48px";
            gradientBox.style.borderRadius = "4px";
            gradientBox.style.background = gradient;
            gradientBox.style.border = `${step1} 1px solid`;
            themeBox.appendChild(gradientBox);

            let isSelected = selected_accent[0] == accentColors[i][0] && selected_accent[1] == accentColors[i][1] && selected_accent[2] == accentColors[i][2];

            const indicator = document.createElement("div");
            indicator.style.width = isSelected ? "48px" : "8px";
            indicator.style.height = "8px";
            indicator.style.borderRadius = "8px";
            indicator.style.marginTop = "4px";
            indicator.style.marginLeft = isSelected ? "0" : "20px";
            indicator.style.backgroundColor = rgbString;
            indicator.style.border = `${step1} 1px solid`;
            indicator.style.transition = ".4s";
            themeBox.appendChild(indicator);

            this.accentIndicators.push(indicator);

            themeBox.onclick = () => {
                localStorage.setItem("accent_color", `${accentColors[i][0]},${accentColors[i][1]},${accentColors[i][2]}`);
                UI.SetAccentColor(accentColors[i]);

                for (let j = 0; j < WIN.array.length; j++) { //update other setting windows
                    if (WIN.array[j] instanceof Settings && WIN.array[j].params === "appearance") {
                        for (let k = 0; k < this.accentIndicators.length; k++) {
                            WIN.array[j].accentIndicators[k].style.width = "8px";
                            WIN.array[j].accentIndicators[k].style.marginLeft = "20px";
                        }
                        WIN.array[j].accentIndicators[i].style.width = "48px";
                        WIN.array[j].accentIndicators[i].style.marginLeft = "0px";
                    }

                    if (WIN.array[j].popoutWindow) {
                        let accent = localStorage.getItem("accent_color").split(",").map(o => parseInt(o.trim()));
                        let hsl = UI.RgbToHsl(accent);
                        let select = `hsl(${hsl[0]+7},${hsl[1]}%,${hsl[2]*.9}%)`;
                        WIN.array[j].popoutWindow.document.querySelector(":root").style.setProperty("--clr-accent", `rgb(${accent[0]},${accent[1]},${accent[2]})`);
                        WIN.array[j].popoutWindow.document.querySelector(":root").style.setProperty("--clr-select", select);
                    }
                }
            };
        }

        this.chkWinMaxxed.checked     = localStorage.getItem("w_always_maxed") === "true";
        this.chkWindowShadows.checked = localStorage.getItem("w_dropshadow") !== "false";
        this.chkAnimations.checked    = localStorage.getItem("animations") !== "false";

        const Apply = ()=> {
            WIN.always_maxxed = this.chkWinMaxxed.checked;
            container.className = this.chkWindowShadows.checked ? "" : "disable-window-dropshadows";
            document.body.className = this.chkAnimations.checked ? "" : "disable-animations";

            localStorage.setItem("w_always_maxed", this.chkWinMaxxed.checked);
            localStorage.setItem("w_dropshadow", this.chkWindowShadows.checked);
            localStorage.setItem("animations", this.chkAnimations.checked);

            for (let i = 0; i < WIN.array.length; i++) //update other setting windows
                if (WIN.array[i] instanceof Settings && WIN.array[i].params === "appearance") {
                    WIN.array[i].chkWinMaxxed.checked     = this.chkWinMaxxed.checked;
                    WIN.array[i].chkAnimations.checked    = this.chkAnimations.checked;
                    WIN.array[i].chkWindowShadows.checked = this.chkWindowShadows.checked;
                }
        };

        this.chkWinMaxxed.onchange     = Apply;
        this.chkAnimations.onchange    = Apply;
        this.chkWindowShadows.onchange = Apply;

        Apply();
    }

    ShowRegion() {
        this.params = "region";
        this.subContent.innerHTML = "";

        const divRegion = document.createElement("div");
        divRegion.textContent = "Region: ";
        divRegion.style.display = "inline-block";
        divRegion.style.minWidth = "200px";
        divRegion.style.fontWeight = "600";
        this.subContent.appendChild(divRegion);

        this.region = document.createElement("select");
        this.region.style.width = "200px";
        this.subContent.appendChild(this.region);

        const countries = [
            { name: "System format", code: "sys" },
            { name: "Arabic - Saudi Arabia", code: "ar-SA" },
            { name: "Bengali - Bangladesh", code: "bn-BD" },
            { name: "Bengali - India", code: "bn-IN" },
            { name: "Czech - Czech Republic", code: "cs-CZ" },
            { name: "Danish - Denmark", code: "da-DK" },
            { name: "German - Austria", code: "de-AT" },
            { name: "German - Switzerland", code: "de-CH" },
            { name: "German - Germany", code: "de-DE" },
            { name: "Greek - Greece", code: "el-GR" },
            { name: "English - Australia", code: "en-AU" },
            { name: "English - Canada", code: "en-CA" },
            { name: "English - United Kingdom", code: "en-GB" },
            { name: "English - Ireland", code: "en-IE" },
            { name: "English - India", code: "en-IN" },
            { name: "English - New Zealand", code: "en-NZ" },
            { name: "English - United States", code: "en-US" },
            { name: "English - South Africa", code: "en-ZA" },
            { name: "Spanish - Argentina", code: "es-AR" },
            { name: "Spanish - Chile", code: "es-CL" },
            { name: "Spanish - Colombia", code: "es-CO" },
            { name: "Spanish - Spain", code: "es-ES" },
            { name: "Spanish - Mexico", code: "es-MX" },
            { name: "Spanish - United States", code: "es-US" },
            { name: "Finnish - Finland", code: "fi-FI" },
            { name: "French - Belgium", code: "fr-BE" },
            { name: "French - Canada", code: "fr-CA" },
            { name: "French - Switzerland", code: "fr-CH" },
            { name: "French - France", code: "fr-FR" },
            { name: "Hebrew - Israel", code: "he-IL" },
            { name: "Hindi - India", code: "hi-IN" },
            { name: "Hungarian - Hungary", code: "hu-HU" },
            { name: "Indonesian - Indonesia", code: "id-ID" },
            { name: "Italian - Switzerland", code: "it-CH" },
            { name: "Italian - Italy", code: "it-IT" },
            { name: "Japanese - Japan", code: "ja-JP" },
            { name: "Korean - South Korea", code: "ko-KR" },
            { name: "Dutch - Belgium", code: "nl-BE" },
            { name: "Dutch - Netherlands", code: "nl-NL" },
            { name: "Norwegian - Norway", code: "no-NO" },
            { name: "Polish - Poland", code: "pl-PL" },
            { name: "Portuguese - Brazil", code: "pt-BR" },
            { name: "Portuguese - Portugal", code: "pt-PT" },
            { name: "Romanian - Romania", code: "ro-RO" },
            { name: "Russian - Russia", code: "ru-RU" },
            { name: "Slovak - Slovakia", code: "sk-SK" },
            { name: "Swedish - Sweden", code: "sv-SE" },
            { name: "Tamil - India", code: "ta-IN" },
            { name: "Tamil - Sri Lanka", code: "ta-LK" },
            { name: "Thai - Thailand", code: "th-TH" },
            { name: "Turkish - Turkey", code: "tr-TR" },
            { name: "Chinese - China", code: "zh-CN" },
            { name: "Chinese - Hong Kong", code: "zh-HK" },
            { name: "Chinese - Taiwan", code: "zh-TW" }
        ]

        for (let i = 0; i < countries.length; i++) {
            const option = document.createElement("option");
            option.value = countries[i].code;
            option.textContent = countries[i].name;
            this.region.appendChild(option);
        }

        const date = document.createElement("div");
        this.subContent.appendChild(date);

        const time = document.createElement("div");
        this.subContent.appendChild(time);

        const digits = document.createElement("div");
        this.subContent.appendChild(digits);

        this.region.onchange = event=>{
            const now = new Date();
            date_month.textContent = now.toLocaleDateString(this.region.value, {month:"short"}).toUpperCase();
            date_date.textContent = now.getDate();
            date_day.textContent = now.toLocaleDateString(this.region.value, {weekday:"long"});

            date.textContent = now.toLocaleDateString(this.region.value, {});
            time.textContent = now.toLocaleTimeString(this.region.value, {});

            digits.textContent = "";
        };

    }

    ShowSession() {
        this.params = "session";
        this.subContent.innerHTML = "";

        this.chkRestoreSession = document.createElement("input");
        this.chkRestoreSession.type = "checkbox";
        this.subContent.appendChild(this.chkRestoreSession);
        this.AddCheckBoxLabel(this.subContent, this.chkRestoreSession, "Re-open previous windows on page load").style.fontWeight = "600";

        this.subContent.appendChild(document.createElement("br"));
        this.subContent.appendChild(document.createElement("br"));
        this.subContent.appendChild(document.createElement("hr"));
        this.subContent.appendChild(document.createElement("br"));

        this.chkAliveOnClose = document.createElement("input");
        this.chkAliveOnClose.type = "checkbox";
        this.subContent.appendChild(this.chkAliveOnClose);
        this.AddCheckBoxLabel(this.subContent, this.chkAliveOnClose, "Keep session alive when browser is closed").style.fontWeight = "600";

        this.subContent.appendChild(document.createElement("br"));
        this.subContent.appendChild(document.createElement("br"));

        const divSessionTimeout = document.createElement("div");
        divSessionTimeout.textContent = "Logout if inactive for: ";
        divSessionTimeout.style.display = "inline-block";
        divSessionTimeout.style.minWidth = "200px";
        divSessionTimeout.style.fontWeight = "600";
        this.subContent.appendChild(divSessionTimeout);

        this.sessionTimeout = document.createElement("input");
        this.sessionTimeout.type = "range";
        this.sessionTimeout.min = "1";
        this.sessionTimeout.max = "8";
        this.sessionTimeout.style.width = "200px";
        this.subContent.appendChild(this.sessionTimeout);

        this.divSessionTimeoutValue = document.createElement("div");
        this.divSessionTimeoutValue.textContent = "15 min.";
        this.divSessionTimeoutValue.style.paddingLeft = "8px";
        this.divSessionTimeoutValue.style.display = "inline-block";
        this.subContent.appendChild(this.divSessionTimeoutValue);


        this.subContent.appendChild(document.createElement("br"));
        this.subContent.appendChild(document.createElement("br"));

        const divCookieLife = document.createElement("div");
        divCookieLife.textContent = "Cookie lifetime: ";
        divCookieLife.style.display = "inline-block";
        divCookieLife.style.minWidth = "200px";
        divCookieLife.style.fontWeight = "600";
        this.subContent.appendChild(divCookieLife);

        this.cookieLife = document.createElement("input");
        this.cookieLife.type = "range";
        this.cookieLife.min = "1";
        this.cookieLife.max = "12";
        this.cookieLife.style.width = "200px";
        this.subContent.appendChild(this.cookieLife);

        this.divCookieLifeValue = document.createElement("div");
        this.divCookieLifeValue.textContent = "15 min.";
        this.divCookieLifeValue.style.paddingLeft = "8px";
        this.divCookieLifeValue.style.display = "inline-block";
        this.subContent.appendChild(this.divCookieLifeValue);


        this.subContent.appendChild(document.createElement("br"));
        this.subContent.appendChild(document.createElement("br"));
        this.subContent.appendChild(document.createElement("hr"));
        this.subContent.appendChild(document.createElement("br"));

        const btnClearLocalCache = document.createElement("input");
        btnClearLocalCache.type = "button";
        btnClearLocalCache.value = "Clear local storage";
        btnClearLocalCache.style.height = "36px";
        btnClearLocalCache.style.padding = "8px";
        this.subContent.appendChild(btnClearLocalCache);

        this.chkRestoreSession.checked = localStorage.getItem("restore_session") === "true";
        this.chkAliveOnClose.checked = localStorage.getItem("alive_after_close") === "true";
        this.sessionTimeout.value = localStorage.getItem("session_timeout") == null ? 1 : parseInt(localStorage.getItem("session_timeout"));
        this.cookieLife.value = localStorage.getItem("cookie_lifetime") == null ? 7 : parseInt(localStorage.getItem("cookie_lifetime"));


        btnClearLocalCache.onclick = () => { this.ClearCache() };

        const timeMapping = { 1:15, 2:30, 3:60, 4:2*60, 5:4*60, 6:8*60, 7:24*60, 8:Infinity };
        const cookieMapping = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:14, 9:21, 10:28, 11:60, 12:90 };
        const Apply = () => {
            localStorage.setItem("restore_session", this.chkRestoreSession.checked);
            localStorage.setItem("alive_after_close", this.chkAliveOnClose.checked);
            localStorage.setItem("session_timeout", this.sessionTimeout.value);
            localStorage.setItem("cookie_lifetime", this.cookieLife.value);           
            
            for (let i = 0; i < WIN.array.length; i++) //update other setting windows
                if (WIN.array[i] instanceof Settings && WIN.array[i].params === "session") {
                    WIN.array[i].chkRestoreSession.checked = this.chkRestoreSession.checked;
                    WIN.array[i].chkAliveOnClose.checked   = this.chkAliveOnClose.checked;
                    WIN.array[i].sessionTimeout.value      = this.sessionTimeout.value;
                    WIN.array[i].cookieLife.value = this.cookieLife.value;

                    if (timeMapping[this.sessionTimeout.value] == Infinity) {
                        WIN.array[i].divSessionTimeoutValue.textContent = timeMapping[this.sessionTimeout.value];
                    } else {
                        let value = timeMapping[this.sessionTimeout.value];
                        WIN.array[i].divSessionTimeoutValue.textContent = value > 60 ? value / 60 + " hours" : value + " minutes";
                    }

                    if (cookieMapping[this.cookieLife.value] < 8)
                        WIN.array[i].divCookieLifeValue.textContent = cookieMapping[this.cookieLife.value] == 1 ? "1 day" : cookieMapping[this.cookieLife.value] + " days";
                    else if (cookieMapping[this.cookieLife.value] < 29)
                        WIN.array[i].divCookieLifeValue.textContent = cookieMapping[this.cookieLife.value] == 7 ? "1 week" : cookieMapping[this.cookieLife.value] / 7 + " weeks";
                    else
                        WIN.array[i].divCookieLifeValue.textContent = cookieMapping[this.cookieLife.value] == 30 ? "1 month" : cookieMapping[this.cookieLife.value] / 30 + " months";

                }
        };

        this.chkRestoreSession.onchange = Apply;
        this.chkAliveOnClose.onchange = Apply;
        this.sessionTimeout.oninput = Apply;

        this.cookieLife.oninput = () => {
            KEEP.SendAction(`updatesessiontimeout${String.fromCharCode(127)}${cookieMapping[this.cookieLife.value]}`);
            Apply();
        };

        Apply();
    }

    async ShowAbout() {
        this.params = "about";
        this.subContent.innerHTML = "";

        const aboutBox = document.createElement("div");
        aboutBox.style.padding = "16px";
        aboutBox.style.display = "grid";
        aboutBox.style.gridTemplateColumns = "auto 150px 200px auto";
        aboutBox.style.gridTemplateRows = "repeat(6, 24px)";
        aboutBox.style.alignItems = "end";
        aboutBox.style.userSelect = "text";
        this.subContent.appendChild(aboutBox);

        const logo = document.createElement("img");
        logo.style.gridArea = "1 / 2 / 6 / 2";
        logo.style.userSelect = "none";
        logo.style.userDrag = "none";
        logo.style.webkitUserDrag = "none";
        logo.width = "128";
        logo.height = "128";
        logo.src = "mono/logo.svg";
        aboutBox.appendChild(logo);

        const name = document.createElement("div");
        name.style.gridArea = "2 / 3";
        name.style.fontWeight = "600";
        name.textContent = "Pro-test";
        aboutBox.appendChild(name);

        const version = document.createElement("div");
        version.style.gridArea = "3 / 3";
        version.style.fontWeight = "500";
        version.textContent = `Version ${KEEP.version}`;
        aboutBox.appendChild(version);

        const description = document.createElement("div");
        description.style.fontWeight = "500";
        description.style.textAlign = "center";
        description.style.userSelect = "text";
        description.textContent = "A management base for System Admins.";
        this.subContent.appendChild(description);

        const center = document.createElement("div");
        center.style.textAlign = "center";
        this.subContent.appendChild(center);

        const opensource = document.createElement("div");
        opensource.style.margin = "auto";
        opensource.style.paddingTop = "32px";
        opensource.style.fontWeight = "500";
        opensource.style.textAlign = "left";
        opensource.style.maxWidth = "640px";
        opensource.style.userSelect = "text";
        opensource.textContent = "Pro-test is a free and open-source tool developed and maintained by Andreas Venizelou. All of the source code to this product is available to you under the GNU General Public License.";
        center.appendChild(opensource);

        const gpl = document.createElement("div");
        gpl.style.margin = "auto";
        gpl.style.paddingTop = "32px";
        gpl.style.fontWeight = "500";
        gpl.style.textAlign = "left";
        gpl.style.maxWidth = "640px";
        gpl.style.userSelect = "text";
        gpl.textContent = "The GNU General Public License is a type of open-source license that allows users to access, use, copy, modify, and distribute the source code of a product. It also requires that any derivative works (modified versions of the original source code) are also distributed under the same license, and the original author must be acknowledged. This ensures that the source code remains freely available to the public and can be used for any purpose.";
        center.appendChild(gpl);


        center.appendChild(document.createElement("br"));
        center.appendChild(document.createElement("br"));

        //TODO:
        /*const credits = document.createElement("div");
        credits.style.margin = "auto";
        credits.style.paddingTop = "32px";
        credits.style.maxWidth = "640px";
        credits.style.textAlign = "left";
        credits.style.userSelect = "text";
        credits.textContent = "Some of Pro-tests tools use external code and make use of the following libraries:<br>";
        credits.textContent += "<b>-</b> MAC addresses lookup table          <a target="_blank" href="https://regauth.standards.ieee.org/standards-ra-web/pub/view.html">by ieee</a><br>";
        credits.textContent += "<b>-</b> IP2Location LITE                    <a target="_blank" href="https://ip2location.com">by ip2location.com</a><br>";
        credits.textContent += "<b>-</b> IP2Proxy LITE                       <a target="_blank" href="https://ip2location.com">by ip2location.com</a><br>";
        credits.textContent += "<b>-</b> Renci.SshNet.SshClient              <a target="_blank" href="https://nuget.org/packages/SSH.NET">by Renci</a><br>";
        credits.textContent += "<b>-</b> Microsoft.Management.Infrastructure <a target="_blank" href="https://nuget.org/packages/Microsoft.Management.Infrastructure/">by Microsoft</a><br>";
        credits.textContent += "<b>-</b> System.Management.Automation        <a target="_blank" href="https://docs.microsoft.com/en-us/dotnet/api/system.management.automation">by Microsoft</a><br>";
        credits.textContent += "<b>-</b> Open Sans typeface                  <a>by Steve Matteson</a><br>";
        center.appendChild(credits);*/

        center.appendChild(document.createElement("br"));
        center.appendChild(document.createElement("br"));

        const donate = document.createElement("a");
        donate.style.display = "inline-block";
        donate.style.border = "#202020 1px solid";
        donate.style.borderRadius = "4px";
        donate.style.padding = "2px 4px";
        donate.style.margin = "1px";
        donate.target = "_blank";
        donate.href = "https://paypal.me/veniware/10";
        donate.textContent = "Make a donation";
        center.appendChild(donate);

        const _or = document.createElement("div");
        _or.style.display = "inline-block";
        _or.style.padding = "1px 4px";
        _or.textContent = "or";
        center.appendChild(_or);

        const involve = document.createElement("a");
        involve.style.display = "inline-block";
        involve.style.border = "#202020 1px solid";
        involve.style.borderRadius = "4px";
        involve.style.padding = "2px 4px";
        involve.style.margin = "1px";
        involve.target = "_blank";
        involve.href = "https://github.com/veniware/OpenProtest";
        involve.textContent = "get involved";
        center.appendChild(involve);

        center.appendChild(document.createElement("br"));
        center.appendChild(document.createElement("br"));
        center.appendChild(document.createElement("br"));

        const icons = ["mono/logo.svg", "mono/copyleft.svg", "mono/opensource.svg","mono/gpl.svg", "mono/github.svg"];
        for (let i = 0; i < icons.length; i++) {
            const newIcon = document.createElement("div");
            newIcon.style.display = "inline-block";
            newIcon.style.width = "52px";
            newIcon.style.height = "52px";
            newIcon.style.margin = "16px";
            newIcon.style.background = `url(${icons[i]})`;
            newIcon.style.backgroundSize = "contain";
            center.appendChild(newIcon);
        }

        logo.onclick = () => {
            logo.animate([
                {transform:"translateX(-1px) rotate(0deg)"},
                {transform:"translateX(6px) rotate(2deg)"},
                {transform:"translateX(-8px) rotate(-3deg)"},
                {transform:"translateX(8px) rotate(3deg)"},
                {transform:"translateX(-8px) rotate(-3deg)"},
                {transform:"translateX(8px) rotate(3deg)"},
                {transform:"translateX(-6px) rotate(-2deg)"},
                {transform:"translateX(6px) rotate(2deg)"},
                {transform:"translateX(-2px) rotate(-1deg)"},
                {transform:"translateX(0) rotate(0deg)"}
            ], {
                duration:1200, iterations:1
            });
        };
    }

    async ShowLegal() {
        this.params = "legal";
        this.subContent.innerHTML = "";

        const box = document.createElement("div");
        box.style.fontFamily = "monospace";
        box.style.userSelect = "text";
        this.subContent.appendChild(box);

        await fetch("/license.txt")
        .then(response=> response.text())
        .then(text=>{
            if (text.length === 0) return;
            text = text.replaceAll(" ", "&nbsp;");
            text = text.replaceAll("<", "&lt;");
            text = text.replaceAll(">", "&gt;");
            text = text.replaceAll("\n", "<br>");
            box.innerHTML = text;
        });
    }

    ClearCache() {
        const btnOK = this.ConfirmBox("Are you sure you want clear local storage? The page will reload after the cleaning.", false);
        if (btnOK) btnOK.addEventListener("click", () => {
            localStorage.clear();
            location.reload();
        });
    }

}