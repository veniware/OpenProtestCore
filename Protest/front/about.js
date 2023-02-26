class About extends Tabs {
	constructor(params) {
		super(null);

		this.params = params ? params : "";

		this.SetTitle("About");
		this.SetIcon("mono/logo.svg");

		this.tabsBox.style.width = "175px";
		this.tabsPanel.style.left = "200px";
		this.tabsPanel.style.padding = "24px";
		this.tabsPanel.style.overflowY = "auto";

		this.tabAbout   = this.AddTab("About", "mono/logo.svg");
		this.tabLegal   = this.AddTab("License", "mono/gpl.svg");

		this.tabAbout.onclick = () => this.ShowAbout();
		this.tabLegal.onclick = () => this.ShowLegal();

		switch (this.params) {
			case "legal":
				this.tabLegal.className = "v-tab-selected";
				this.ShowLegal();
				break;

			default:
				this.tabAbout.className = "v-tab-selected";
				this.ShowAbout();
		}
	}

	async ShowAbout() {
		this.params = "about";
		this.tabsPanel.innerHTML = "";

		const aboutBox = document.createElement("div");
		aboutBox.style.padding = "16px";
		aboutBox.style.display = "grid";
		aboutBox.style.gridTemplateColumns = "auto 150px 200px auto";
		aboutBox.style.gridTemplateRows = "repeat(6, 24px)";
		aboutBox.style.alignItems = "end";
		aboutBox.style.userSelect = "text";
		this.tabsPanel.appendChild(aboutBox);

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
		this.tabsPanel.appendChild(description);

		const center = document.createElement("div");
		center.style.textAlign = "center";
		this.tabsPanel.appendChild(center);

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
		this.tabsPanel.innerHTML = "";

		const box = document.createElement("div");
		box.style.fontFamily = "monospace";
		box.style.userSelect = "text";
		this.tabsPanel.appendChild(box);

		await fetch("license.txt")
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

}