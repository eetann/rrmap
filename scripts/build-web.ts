import path from "node:path";
import tailwind from "bun-plugin-tailwind";

const rrmapRoot = path.resolve(import.meta.dirname, "..");
const outdir = path.join(rrmapRoot, "dist", "web");

const result = await Bun.build({
  entrypoints: [path.join(rrmapRoot, "src", "web", "index.html")],
  outdir,
  minify: true,
  plugins: [tailwind],
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

for (const output of result.outputs) {
  console.log(`built: ${path.relative(rrmapRoot, output.path)}`);
}
