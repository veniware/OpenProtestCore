class Personalize extends Tabs {
	constructor(params) {
		super(null);

		this.params = params ? params : "";

		this.SetTitle("Personalize");
		this.SetIcon("mono/personalize.svg");

		this.tabsBox.style.width = "175px";
		this.tabsPanel.style.left = "200px";
		this.tabsPanel.style.padding = "24px";
		this.tabsPanel.style.overflowY = "auto";

		this.tabGui     = this.AddTab("Appearance", "mono/tv.svg");
		this.tabRegion  = this.AddTab("Regional format", "mono/earth.svg" );
		this.tabSession = this.AddTab("Session", "mono/hourglass.svg");

		this.tabGui.onclick     = () => this.ShowGui();
		this.tabRegion.onclick  = () => this.ShowRegion();
		this.tabSession.onclick = () => this.ShowSession();

		switch (this.params) {
			case "region":
				this.tabRegion.className = "v-tab-selected";
				this.ShowRegion();
				break;

			case "session":
				this.tabSession.className = "v-tab-selected";
				this.ShowSession();
				break;

			default:
				this.tabGui.className = "v-tab-selected";
				this.ShowGui();
		}
	}

	ShowGui() {
		this.params = "appearance";
		this.tabsPanel.innerHTML = "";

		this.chkWinMaxed = document.createElement("input");
		this.chkWinMaxed.type = "checkbox";
		this.tabsPanel.appendChild(this.chkWinMaxed);
		this.AddCheckBoxLabel(this.tabsPanel, this.chkWinMaxed, "Always maximize windows");
		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));

		this.chkPopOut = document.createElement("input");
		this.chkPopOut.type = "checkbox";
		this.tabsPanel.appendChild(this.chkPopOut);
		this.AddCheckBoxLabel(this.tabsPanel, this.chkPopOut, "Pop-out button on windows");
		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));

		this.chkTaskTooltip = document.createElement("input");
		this.chkTaskTooltip.type = "checkbox";
		this.tabsPanel.appendChild(this.chkTaskTooltip);
		this.AddCheckBoxLabel(this.tabsPanel, this.chkTaskTooltip, "Tooltip on taskbar icons");
		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));

		this.chkWindowShadows = document.createElement("input");
		this.chkWindowShadows.type = "checkbox";
		this.tabsPanel.appendChild(this.chkWindowShadows);
		this.AddCheckBoxLabel(this.tabsPanel, this.chkWindowShadows, "Shadow under windows");
		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));

		this.chkAnimations = document.createElement("input");
		this.chkAnimations.type = "checkbox";
		this.tabsPanel.appendChild(this.chkAnimations);
		this.AddCheckBoxLabel(this.tabsPanel, this.chkAnimations, "Animations");
		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));

		this.chkGlass = document.createElement("input");
		this.chkGlass.type = "checkbox";
		this.tabsPanel.appendChild(this.chkGlass);
		this.AddCheckBoxLabel(this.tabsPanel, this.chkGlass, "Glass effect");
		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));

		this.tabsPanel.appendChild(document.createElement("hr"));

		const divColor = document.createElement("div");
		divColor.textContent = "Accent color: ";
		divColor.style.fontWeight = "600";
		divColor.style.paddingBottom = "8px";
		this.tabsPanel.appendChild(divColor);

		this.accentBoxes = document.createElement("div");
		this.tabsPanel.appendChild(this.accentBoxes);

		this.tabsPanel.appendChild(document.createElement("br"));

		const divSaturation = document.createElement("div");
		divSaturation.textContent = "Saturation: ";
		divSaturation.style.display = "inline-block";
		divSaturation.style.minWidth = "120px";
		divSaturation.style.fontWeight = "600";
		this.tabsPanel.appendChild(divSaturation);

		this.saturation = document.createElement("input");
		this.saturation.setAttribute("aria-label", "Accent color saturation");
		this.saturation.type = "range";
		this.saturation.min = "75";
		this.saturation.max = "125";
		this.saturation.style.width = "200px";
		this.tabsPanel.appendChild(this.saturation);

		this.divSaturationValue = document.createElement("div");
		this.divSaturationValue.style.paddingLeft = "8px";
		this.divSaturationValue.style.display = "inline-block";
		this.tabsPanel.appendChild(this.divSaturationValue);

		this.chkWinMaxed.checked      = localStorage.getItem("w_always_maxed") === "true";
		this.chkPopOut.checked        = localStorage.getItem("w_popout") === "true";
		this.chkTaskTooltip.checked   = localStorage.getItem("w_tasktooltip") !== "false";
		this.chkWindowShadows.checked = localStorage.getItem("w_dropshadow") !== "false";
		this.chkAnimations.checked	  = localStorage.getItem("animations") !== "false";
		this.chkGlass.checked		  = localStorage.getItem("glass") === "true";

		this.saturation.value = localStorage.getItem("accent_saturation") ? localStorage.getItem("accent_saturation") : 100;

		this.accentIndicators = [];
		let selected_accent = [255,102,0];
		if (localStorage.getItem("accent_color"))
			selected_accent = JSON.parse(localStorage.getItem("accent_color"));

		const accentColors = [[224,56,64], [255,102,0], [255,186,0], [96,192,32], [36,176,244]];

		for (let i = 0; i < accentColors.length; i++) {
			let hsl = UI.RgbToHsl(accentColors[i]); //--clr-accent
			let step1 = `hsl(${hsl[0]-4},${hsl[1]*this.saturation.value/100}%,${hsl[2]*.78}%)`;
			let step2 = `hsl(${hsl[0]+7},${hsl[1]*this.saturation.value/100}%,${hsl[2]*.9}%)`; //--clr-select
			let step3 = `hsl(${hsl[0]-4},${hsl[1]*this.saturation.value/100}%,${hsl[2]*.8}%)`;
			let gradient = `linear-gradient(to bottom, ${step1}0%, ${step2}92%, ${step3}100%)`;

			const themeBox = document.createElement("div");
			themeBox.style.display = "inline-block";
			themeBox.style.margin = "2px 4px";
			this.accentBoxes.appendChild(themeBox);

			const gradientBox = document.createElement("div");
			gradientBox.style.width = "56px";
			gradientBox.style.height = "56px";
			gradientBox.style.borderRadius = "4px";
			gradientBox.style.background = gradient;
			gradientBox.style.border = `${step1} 1px solid`;
			themeBox.appendChild(gradientBox);

			let isSelected = selected_accent[0] == accentColors[i][0] && selected_accent[1] == accentColors[i][1] && selected_accent[2] == accentColors[i][2];

			const indicator = document.createElement("div");
			indicator.style.width = isSelected ? "56px" : "8px";
			indicator.style.height = "8px";
			indicator.style.borderRadius = "8px";
			indicator.style.marginTop = "4px";
			indicator.style.marginLeft = isSelected ? "0" : "24px";
			indicator.style.backgroundColor = `hsl(${hsl[0]},${hsl[1]*this.saturation.value/100}%,${hsl[2]}%)`;
			indicator.style.border = `${step1} 1px solid`;
			indicator.style.transition = "margin .4s, width .4s";
			themeBox.appendChild(indicator);

			this.accentIndicators.push(indicator);

			themeBox.onclick = ()=> {
				localStorage.setItem("accent_color", JSON.stringify(accentColors[i]));
				Apply();

				for (let j = 0; j < WIN.array.length; j++) { //update other setting windows
					if (WIN.array[j] instanceof Personalize && WIN.array[j].params === "appearance") {
						for (let k = 0; k < this.accentIndicators.length; k++) {
							if (k === i) continue;
							WIN.array[j].accentIndicators[k].style.width = "8px";
							WIN.array[j].accentIndicators[k].style.marginLeft = "24px";
						}
						WIN.array[j].accentIndicators[i].style.width = "56px";
						WIN.array[j].accentIndicators[i].style.marginLeft = "0px";
					}
				}
			};
		}


		const Apply = ()=> {
			WIN.always_maxed = this.chkWinMaxed.checked;
			taskbar.className = this.chkTaskTooltip.checked ? "" : "no-tooltip";

			container.className = "";
			if (!this.chkPopOut.checked)        container.classList.add("no-popout");
			if (!this.chkWindowShadows.checked) container.classList.add("disable-window-dropshadows");
			if (this.chkGlass.checked)          container.classList.add("glass");

			document.body.className = this.chkAnimations.checked ? "" : "disable-animations";

			localStorage.setItem("w_always_maxed", this.chkWinMaxed.checked);
			localStorage.setItem("w_popout", this.chkPopOut.checked);
			localStorage.setItem("w_tasktooltip", this.chkTaskTooltip.checked);
			localStorage.setItem("w_dropshadow", this.chkWindowShadows.checked);
			localStorage.setItem("animations", this.chkAnimations.checked);
			localStorage.setItem("glass", this.chkGlass.checked);

			localStorage.setItem("accent_saturation", this.saturation.value);

			for (let i = 0; i < WIN.array.length; i++) { //update other setting windows
				if (WIN.array[i] instanceof Personalize && WIN.array[i].params === "appearance") {

					if (WIN.array[i] !== this) {
						WIN.array[i].chkWinMaxed.checked      = this.chkWinMaxed.checked;
						WIN.array[i].chkPopOut.checked        = this.chkPopOut.checked;
						WIN.array[i].chkTaskTooltip.checked   = this.chkTaskTooltip.checked;
						WIN.array[i].chkWindowShadows.checked = this.chkWindowShadows.checked;
						WIN.array[i].chkAnimations.checked    = this.chkAnimations.checked;
						WIN.array[i].chkGlass.checked         = this.chkGlass.checked;

						WIN.array[i].saturation.value = this.saturation.value;
						WIN.array[i].divSaturationValue.textContent = `${this.saturation.value}%`;
					}

					let saturation = this.saturation.value / 100;
					for (let j = 0; j < this.accentBoxes.childNodes.length; j++) {
						let hsl = UI.RgbToHsl(accentColors[j]);
						let step1 = `hsl(${hsl[0]-4},${hsl[1]*saturation}%,${hsl[2]*.78}%)`;
						let step2 = `hsl(${hsl[0]+7},${hsl[1]*saturation}%,${hsl[2]*.9}%)`; //--clr-select
						let step3 = `hsl(${hsl[0]-4},${hsl[1]*saturation}%,${hsl[2]*.8}%)`;
						let gradient = `linear-gradient(to bottom, ${step1}0%, ${step2}92%, ${step3}100%)`;
					
						WIN.array[i].accentBoxes.childNodes[j].firstChild.style.background = gradient;
						WIN.array[i].accentBoxes.childNodes[j].lastChild.style.backgroundColor = `hsl(${hsl[0]},${hsl[1]*saturation}%,${hsl[2]}%)`;
						WIN.array[i].accentBoxes.childNodes[j].firstChild.style.border = `${step1} 1px solid`;
						WIN.array[i].accentBoxes.childNodes[j].lastChild.style.border = `${step1} 1px solid`;
					}
				}

				if (WIN.array[i].popOutWindow) {
					let accent = JSON.parse(localStorage.getItem("accent_color"));
					let hsl = UI.RgbToHsl(accent);
					WIN.array[i].popOutWindow.document.querySelector(":root").style.setProperty("--clr-select", `hsl(${hsl[0]+7},${hsl[1]*this.saturation.value/100}%,${hsl[2]*.9}%)`);
					WIN.array[i].popOutWindow.document.querySelector(":root").style.setProperty("--clr-accent", `hsl(${hsl[0]},${hsl[1]*this.saturation.value/100}%,${hsl[2]}%)`);
				}
			}

			this.divSaturationValue.textContent = `${this.saturation.value}%`;

			let accentColor = localStorage.getItem("accent_color") ? JSON.parse(localStorage.getItem("accent_color")) : [255,102,0];

			localStorage.setItem("accent_saturation", this.saturation.value);
			UI.SetAccentColor(accentColor, this.saturation.value / 100);
		};

		this.chkWinMaxed.onchange      = Apply;
		this.chkPopOut.onchange        = Apply;
		this.chkTaskTooltip.onchange   = Apply;
		this.chkWindowShadows.onchange = Apply;
		this.chkAnimations.onchange    = Apply;
		this.chkGlass.onchange         = Apply;
		this.saturation.oninput        = Apply;

		Apply();
	}

	ShowRegion() {
		this.params = "region";
		this.tabsPanel.innerHTML = "";

		const divRegion = document.createElement("div");
		divRegion.textContent = "Region: ";
		divRegion.style.display = "inline-block";
		divRegion.style.minWidth = "200px";
		divRegion.style.fontWeight = "600";
		this.tabsPanel.appendChild(divRegion);

		this.region = document.createElement("select");
		this.region.style.width = "200px";
		this.tabsPanel.appendChild(this.region);

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
		this.tabsPanel.appendChild(date);

		const time = document.createElement("div");
		this.tabsPanel.appendChild(time);

		const digits = document.createElement("div");
		this.tabsPanel.appendChild(digits);

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
		this.tabsPanel.innerHTML = "";

		this.chkRestoreSession = document.createElement("input");
		this.chkRestoreSession.type = "checkbox";
		this.tabsPanel.appendChild(this.chkRestoreSession);
		this.AddCheckBoxLabel(this.tabsPanel, this.chkRestoreSession, "Re-open previous windows on page load").style.fontWeight = "600";

		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("hr"));
		this.tabsPanel.appendChild(document.createElement("br"));

		this.chkAliveOnClose = document.createElement("input");
		this.chkAliveOnClose.type = "checkbox";
		this.tabsPanel.appendChild(this.chkAliveOnClose);
		this.AddCheckBoxLabel(this.tabsPanel, this.chkAliveOnClose, "Keep session alive when browser is closed").style.fontWeight = "600";

		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));

		const divSessionTimeout = document.createElement("div");
		divSessionTimeout.textContent = "Logout if inactive for: ";
		divSessionTimeout.style.display = "inline-block";
		divSessionTimeout.style.minWidth = "200px";
		divSessionTimeout.style.fontWeight = "600";
		this.tabsPanel.appendChild(divSessionTimeout);

		this.sessionTimeout = document.createElement("input");
		this.sessionTimeout.setAttribute("aria-label", "Logout when inactive");
		this.sessionTimeout.type = "range";
		this.sessionTimeout.min = "1";
		this.sessionTimeout.max = "8";
		this.sessionTimeout.style.width = "200px";
		this.tabsPanel.appendChild(this.sessionTimeout);

		this.divSessionTimeoutValue = document.createElement("div");
		this.divSessionTimeoutValue.textContent = "15 min.";
		this.divSessionTimeoutValue.style.paddingLeft = "8px";
		this.divSessionTimeoutValue.style.display = "inline-block";
		this.tabsPanel.appendChild(this.divSessionTimeoutValue);


		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));

		const divCookieLife = document.createElement("div");
		divCookieLife.textContent = "Cookie lifetime: ";
		divCookieLife.style.display = "inline-block";
		divCookieLife.style.minWidth = "200px";
		divCookieLife.style.fontWeight = "600";
		this.tabsPanel.appendChild(divCookieLife);

		this.cookieLife = document.createElement("input");
		this.cookieLife.setAttribute("aria-label", "Cookie lifetime");
		this.cookieLife.type = "range";
		this.cookieLife.min = "1";
		this.cookieLife.max = "12";
		this.cookieLife.style.width = "200px";
		this.tabsPanel.appendChild(this.cookieLife);

		this.divCookieLifeValue = document.createElement("div");
		this.divCookieLifeValue.textContent = "15 min.";
		this.divCookieLifeValue.style.paddingLeft = "8px";
		this.divCookieLifeValue.style.display = "inline-block";
		this.tabsPanel.appendChild(this.divCookieLifeValue);


		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("br"));
		this.tabsPanel.appendChild(document.createElement("hr"));
		this.tabsPanel.appendChild(document.createElement("br"));

		const btnClearLocalCache = document.createElement("input");
		btnClearLocalCache.type = "button";
		btnClearLocalCache.value = "Clear local storage";
		btnClearLocalCache.style.height = "36px";
		btnClearLocalCache.style.padding = "8px";
		this.tabsPanel.appendChild(btnClearLocalCache);

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
				if (WIN.array[i] instanceof Personalize && WIN.array[i].params === "session") {
					WIN.array[i].chkRestoreSession.checked = this.chkRestoreSession.checked;
					WIN.array[i].chkAliveOnClose.checked   = this.chkAliveOnClose.checked;
					WIN.array[i].sessionTimeout.value      = this.sessionTimeout.value;
					WIN.array[i].cookieLife.value          = this.cookieLife.value;

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

	ClearCache() {
		const btnOK = this.ConfirmBox("Are you sure you want clear local storage? The page will reload after the cleaning.", false);
		if (btnOK) btnOK.addEventListener("click", () => {
			localStorage.clear();
			location.reload();
		});
	}

}