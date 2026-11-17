import { createApp } from "vue";
import "./styles.css";
import "./desk.css";
import "./mobile.css";
import App from "./App.vue";
import { registerServiceWorker } from "./pwa";
import { preventNativeContextMenu } from "./utils/contextMenu";
import { guardSelectionOrigin } from "./utils/selectionOrigin";
import { trackPointerButtonFocus } from "./utils/pointerButtonFocus";

document.addEventListener("contextmenu", preventNativeContextMenu, true);
trackPointerButtonFocus(document);
guardSelectionOrigin(document);

createApp(App).mount("#app");
if (import.meta.env.VITE_MINI_DESK_OFFLINE !== "1") void registerServiceWorker();
else document.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (link && /^(https?:)?\/\//i.test(link.getAttribute("href") ?? "")) event.preventDefault();
}, true);
