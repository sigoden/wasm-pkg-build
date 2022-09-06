import { reverse } from "./pkg/test_crate_worker.mjs";

postMessage({ action: "init" });
addEventListener('message', ({ data }) =>  {
  if (data?.action === "ping") {
    const { text } = data;
    console.log(`[worker] recv ping(${text}), send pong`);
    postMessage({ action: "pong", text: reverse(text) });
  }
});