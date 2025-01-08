import { heightInit } from "./height";
import { scrollInit } from "./scroll";
import { toggleInit } from "./toggle";

// Initialize Menu Elements
function utilsInit() {
  scrollInit();
  toggleInit();
  heightInit();
}

document.addEventListener("DOMContentLoaded", utilsInit);
