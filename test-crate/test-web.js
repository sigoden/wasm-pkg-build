import init from "./pkg/test_crate_web.js";

async function main() {
  const mod = await init()
  document.querySelector("#output").innerHTML = mod.reverse("abc")
}

window.addEventListener("DOMContentLoaded", main);
