const { reverse } = require("./pkg/test_crate.js");
console.log(reverse("test_crate"));
const { reverse: reverse2 } = require("./pkg/test_crate_inline.js");
console.log(reverse2("test_crate_inline"));