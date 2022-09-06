const crate = require("./pkg/test_crate.js");
console.log(crate.reverse("test_crate"));
console.log(new crate.Greeter("test_crate").greet());
const crateInline = require("./pkg/test_crate_inline.js");
console.log(crateInline.reverse("test_crate_inline"));
console.log(new crateInline.Greeter("test_crate_inline").greet());