use wasm_bindgen::prelude::*;


#[wasm_bindgen]
pub fn reverse(input: &str) -> String {
	return input.chars().rev().collect();
}

#[wasm_bindgen]
pub struct Greeter {
	name: String,
}

#[wasm_bindgen]
impl Greeter {
	#[wasm_bindgen(constructor)]
    pub fn new(name: &str) -> Self {
		Greeter { name: name.to_string( )}
	}

	#[wasm_bindgen]
	pub fn greet(&self) -> String {
		format!("Hello, {}", self.name)
	}
}