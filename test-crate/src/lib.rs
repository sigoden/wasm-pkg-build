use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn reverse(input: &str) -> String {
	return input.chars().rev().collect();
}