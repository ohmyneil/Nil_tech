const fs = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "dist");
const staticEntries = ["index.html", "css", "js", "assets"];

async function build() {
  await fs.rm(outputDirectory, { recursive: true, force: true });
  await fs.mkdir(outputDirectory, { recursive: true });

  await Promise.all(staticEntries.map(function(entry) {
    return fs.cp(
      path.join(projectRoot, entry),
      path.join(outputDirectory, entry),
      { recursive: true }
    );
  }));

  console.log("Static site built to dist/");
}

build().catch(function(error) {
  console.error("Build failed:", error.message);
  process.exitCode = 1;
});
