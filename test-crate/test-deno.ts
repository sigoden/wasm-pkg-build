import { assertEquals } from "https://deno.land/std@0.223.0/assert/mod.ts";
import * as crate from "./pkg/test_crate_web.js";
import * as crateInline from "./pkg/test_crate_web_inline.js";
Deno.test("reverse", () => {
  assertEquals(crate.reverse("test_crate"), "etarc_tset");
  assertEquals(new crate.Greeter("test_crate").greet(), "Hello, test_crate");
});
Deno.test("reverse inline", () => {
  assertEquals(crateInline.reverse("test_crate_inline"), "enilni_etarc_tset");
  assertEquals(new crateInline.Greeter("test_crate_inline").greet(), "Hello, test_crate_inline");
});
console.log("test-deno succeeded")