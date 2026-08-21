import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/cli.ts"],
  format: "esm",
  platform: "node",
  fixedExtension: false,
  clean: false,
  dts: false,
});
