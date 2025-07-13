
export default class DropdownMenuControl {

    constructor(menuItemsElmId, menuTitleElmId, showCssClass) {
        this.menuItemsElm = document.getElementById(menuItemsElmId);
        this.menuTitleElm = document.getElementById(menuTitleElmId);
        this.menuSelector = `#${menuItemsElmId},#${menuTitleElmId}`;
        this.showCssClass = showCssClass;

        document.addEventListener("click", event => this.hideMenu(event));
        this.menuTitleElm.addEventListener("click", event => this.displayOrHideMenu(event));
    }

    displayOrHideMenu() {
        this.menuItemsElm.classList.toggle(this.showCssClass);
    }

    hideMenu(event) {
        if (!event.target.matches(this.menuSelector)) {
            const menuClElmCList = this.menuItemsElm.classList;
            if (menuClElmCList.contains(this.showCssClass)) menuClElmCList.remove(this.showCssClass);
        }
    }

}