class Settings extends Tabs {
	constructor(params) {
		super(null);

		this.params = params ? params : "";

		this.SetTitle("Settings");
		this.SetIcon("mono/wrench.svg");

		this.tabsBox.style.width = "175px";
		this.tabsPanel.style.left = "200px";
		this.tabsPanel.style.padding = "24px";
		this.tabsPanel.style.overflowY = "auto";

		this.tabUsers         = this.AddTab("Users", "mono/wrench.svg");
		this.tabZones         = this.AddTab("Zones", "mono/wrench.svg");
		this.tabWarnings      = this.AddTab("Warnings", "mono/wrench.svg");
		this.tabEmailProfiles = this.AddTab("E-mail profile", "mono/wrench.svg");
		this.tabMessages      = this.AddTab("Messages", "mono/wrench.svg");

		this.tabUsers.onclick         = () => this.ShowUsers();
		this.tabZones.onclick         = () => this.ShowZones();
		this.tabWarnings.onclick      = () => this.ShowWarnings();
		this.tabEmailProfiles.onclick = () => this.ShowEmailProfiles();
		this.tabMessages.onclick      = () => this.ShowMessages();

		switch (this.params) {
			case "zones":
				this.tabZones.className = "v-tab-selected";
				this.ShowZones();
				break;

			case "warnings":
				this.tabWarnings.className = "v-tab-selected";
				this.ShowWarnings();
				break;


			case "emailprofiles ":
				this.tabEmailProfiles.className = "v-tab-selected";
				this.ShowEmailProfiles();
				break;

			case "messages":
				this.tabMessages.className = "v-tab-selected";
				this.ShowMessages();
				break;

			default:
				this.tabUsers.className = "v-tab-selected";
				this.ShowUsers();
		}
	}

	ShowUsers() {}
	ShowZones() {}
	ShowWarnings() {}
	ShowEmailProfiles() {}
	ShowMessages() {}

}