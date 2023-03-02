const LOADER = {
	devices: {},
	users: {},

	baseStyles: [
		"window.css",
		"tip.css",
		"button.css",
		"textbox.css",
		"checkbox.css",
		"range.css"
	],

	baseScripts: [
		"ui.js",
		"window.js",
	],

	primaryScripts: [
		"keepalive.js"
	],
	
	secondaryScripts: [
		"tabs.js",
		"list.js",
		"view.js",
	],

	tertiaryScripts: [
		"about.js",
		"personalize.js",
		"settings.js",
		"deviceslist.js",
		"userslist.js",
		"deviceview.js",
		"userview.js"
	],

	Initialize: () => {
		let count = 0;
		const total = LOADER.baseStyles.length + LOADER.baseScripts.length + LOADER.primaryScripts.length + LOADER.secondaryScripts.length + LOADER.tertiaryScripts.length + 2;

		const callbackHandle = (status, filename) => {
			loadingbar.style.width = 100 * ++count / total + "%";

			if (LOADER.baseStyles.length + LOADER.baseScripts.length === count) { //load primary
				for (let i = 0; i < LOADER.primaryScripts.length; i++)
					LOADER.LoadScript(LOADER.primaryScripts[i], callbackHandle);

			} else if (LOADER.baseStyles.length + LOADER.baseScripts.length + LOADER.primaryScripts.length === count) { //load secondary
				UI.Initialize();
				
				for (let i = 0; i < LOADER.secondaryScripts.length; i++)
					LOADER.LoadScript(LOADER.secondaryScripts[i], callbackHandle);

			} else if (LOADER.baseStyles.length + LOADER.baseScripts.length + LOADER.primaryScripts.length + LOADER.secondaryScripts.length === count) { //load tertiary
				for (let i = 0; i < LOADER.tertiaryScripts.length; i++)
					LOADER.LoadScript(LOADER.tertiaryScripts[i], callbackHandle);

			} else if (count === total - 2) { //js is done, load db
				LOADER.LoadDevices(callbackHandle);
				LOADER.LoadUsers(callbackHandle);

			} else if (count === total) { //all done
				KEEP.Initialize();
				
				setTimeout(() => {
					loadingcontainer.style.filter = "opacity(0)";
					setTimeout(() => { container.removeChild(loadingcontainer); }, 200);
					setTimeout(() => { LOADER.RestoreSession(); }, 250); //restore previous session
				}, 200);
			}
		};

		for (let i = 0; i < LOADER.baseStyles.length; i++)
			LOADER.LoadStyle(LOADER.baseStyles[i], callbackHandle);

		for (let i = 0; i < LOADER.baseScripts.length; i++)
			LOADER.LoadScript(LOADER.baseScripts[i], callbackHandle);
	},

	LoadStyle: (filename, callback) => {
		if (document.head.querySelectorAll(`link[href$='${filename}']`).length > 0) {
			callback("exists", filename);
			return;
		}

		const cssLink = document.createElement("link");
		cssLink.rel = "stylesheet";
		cssLink.href = filename;
		document.head.appendChild(cssLink);

		cssLink.onload = () => callback("ok", filename);
		cssLink.onerror = () => callback("error", filename);
	},

	LoadScript: (filename, callback) => {
		if (document.head.querySelectorAll(`script[src$='${filename}']`).length > 0) {
			callback("exists", filename);
			return;
		}

		const script = document.createElement("script");
		script.setAttribute("defer", true);
		script.src = filename;
		document.body.appendChild(script);

		script.onload = () => callback("ok", filename);
		script.onerror = () => callback("error", filename);
	},

	LoadDevices: async callback => {
		try {
			const response = await fetch("db/devices/get");
			LOADER.devices = await response.json();
			callback("ok", "devices");
		} catch (error) {
			callback(error, "devices");
		}
	},

	LoadUsers: async callback => {
		try {
			const response = await fetch("db/users/get");
			LOADER.users = await response.json();
			callback("ok", "users");
		} catch (error) {
			callback(error, "users");
		}
	},

	StoreSession: () => {
		let session = [];

		if (localStorage.getItem("restore_session") === "true")
			for (let i = 0; i < WIN.array.length; i++)
				session.push({
					class: WIN.array[i].constructor.name,
					params: WIN.array[i].params,
					isMaximized: WIN.array[i].isMaximized,
					isMinimized: WIN.array[i].isMinimized,
					position: WIN.array[i].position,
					left: WIN.array[i].win.style.left,
					top: WIN.array[i].win.style.top,
					width: WIN.array[i].win.style.width,
					height: WIN.array[i].win.style.height
				});

		localStorage.setItem("session", JSON.stringify(session));

		return session;
	},

	RestoreSession: () => {
		let session = localStorage.getItem("session") ? JSON.parse(localStorage.getItem("session")) : {};
		if (localStorage.getItem("restore_session") != "true") return;
		if (session == null || session.length == 0) return;

		for (let i = 0; i < session.length; i++) {
			let win;
			switch (session[i].class) {
				case "About"       : win = new About(session[i].params); break;
				case "Settings"    : win = new Settings(session[i].params); break;
				case "Personalize" : win = new Personalize(session[i].params); break;
				case "DevicesList" : win = new DevicesList(session[i].params); break;
				case "UsersList"   : win = new UsersList(session[i].params); break;
				case "DeviceView"  : win = new DeviceView(session[i].params); break;
				case "UserView"    : win = new UserView(session[i].params); break;
			}

			if (win) {
				if (session[i].isMaximized) win.Toggle();
				if (session[i].isMinimized) win.Minimize();
				win.position = session[i].position;

				if (!WIN.always_maxed) {
					win.win.style.left = session[i].left;
					win.win.style.top = session[i].top;
					win.win.style.width = session[i].width;
					win.win.style.height = session[i].height;
				}
			}
		}
	}

};

LOADER.Initialize();