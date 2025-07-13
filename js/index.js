
import Router from "./paramHashRouter.js";
import Routes from "./routes.js";

import DropdownMenuControl from "./dropdownMenuControl.js";

window.drMenuCntrl = new DropdownMenuControl("menuIts", "menuTitle", "mnShow");

window.router = new Router(Routes,"welcome");

if (typeof google !== "undefined") {
    google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID",
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.querySelector('.g_id_signin'), 
        { theme: "outline", size: "large" }
    );
}
