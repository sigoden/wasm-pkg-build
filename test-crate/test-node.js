const assert = require("assert");
const crate = require("./pkg/test_crate.js");
assert.equal(crate.reverse("test_crate"), "etarc_tset");
assert.equal(new crate.Greeter("test_crate").greet(), "Hello, test_crate");
const crateInline = require("./pkg/test_crate_inline.js");
assert.equal(crateInline.reverse("test_crate_inline"), "enilni_etarc_tset");
assert.equal(new crateInline.Greeter("test_crate_inline").greet(), "Hello, test_crate_inline");
console.log("test-node succeeded")