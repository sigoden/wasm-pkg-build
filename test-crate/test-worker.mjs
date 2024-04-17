import assert from "assert";
import { reverse, Greeter } from "./pkg/test_crate_worker.mjs";
assert.equal(reverse("test_crate"), "etarc_tset");
assert.equal(new Greeter("test_crate").greet(), "Hello, test_crate");
console.log("test-worker succeeded")