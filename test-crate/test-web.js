import init from "./pkg/test_crate_web.js";
import init2 from "./pkg/test_crate_web_inline.js";

async function main() {
  const mod = await init()
  const mod2 = await init2();
  document.querySelector("#output").innerHTML = 
    mod.reverse("test_crate_web") + "<br/>" + mod2.reverse("test_crate_web_inline")
}

window.addEventListener("DOMContentLoaded", main);
