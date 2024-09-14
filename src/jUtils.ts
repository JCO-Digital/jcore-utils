import { scrollInit } from "./scroll";
import { toggleInit } from "./toggle";

// Initialize Menu Elements
function utilsInit() {
  scrollInit();
  toggleInit();
}

document.addEventListener("DOMContentLoaded", utilsInit);
