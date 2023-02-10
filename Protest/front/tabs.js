class Tabs extends Window {
    constructor(themeColor = [64,64,64]) {
        super();

        this.AddCssDependencies("tabs.css");

        this.tabsList = [];
        this.content.style.overflow = "hidden";

        this.subContent = document.createElement("div");
        this.subContent.className = "v-tab-body";
        this.content.appendChild(this.subContent);

        this.tabsContainer = document.createElement("div");
        this.tabsContainer.className = "v-tabs";
        this.tabsContainer.setAttribute("role", "tabpanel");
        this.content.appendChild(this.tabsContainer);
    }

    AddTab(text, icon, subtext) {
        const newTab = document.createElement("div");
        newTab.setAttribute("role", "tab");
        this.tabsContainer.appendChild(newTab);
        this.tabsList.push(newTab);

        const divIcon = document.createElement("div");
        if (icon) divIcon.style.backgroundImage = "url(" + icon + ")";
        newTab.appendChild(divIcon);

        const divText = document.createElement("div");
        divText.textContent = text;
        newTab.appendChild(divText);

        if (subtext) {
            const divSubtext = document.createElement("div");
            divSubtext.textContent = subtext;
            newTab.appendChild(divSubtext);
        }

        newTab.addEventListener("click", event => {
            this.DeselectAllTabs();
            newTab.className = "v-tab-selected";
        });

        return newTab;
    }

    DeselectAllTabs() {
        for (let i = 0; i < this.tabsList.length; i++)
            this.tabsList[i].className = "";
    }

    RemoveTab() { }
}