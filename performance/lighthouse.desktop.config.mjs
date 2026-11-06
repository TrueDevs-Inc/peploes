import desktop from "lighthouse/core/config/desktop-config.js";
import config from "./lighthouse.config.mjs";

export default { ...config, settings: desktop.settings };
