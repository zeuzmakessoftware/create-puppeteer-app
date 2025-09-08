#!/usr/bin/env node
// create-puppeteer-app CLI (no deps)
// Usage:
//   npx create-puppeteer-app my-scraper --use-pnpm
// Options:
//   --use-pnpm | --use-npm | --use-yarn
//   --ts                  (TypeScript template)
//   --core                (use puppeteer-core instead of puppeteer)
//   --skip-chromium       (set PUPPETEER_SKIP_DOWNLOAD=1 during install)
//   --git                 (git init + first commit)
//   --no-install          (skip installing deps)
//   --no-example          (empty src file)
//   --package-name <name> (override npm package name)

import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join, basename, resolve } from "path";
import { spawn } from "child_process";
import { createInterface } from "readline";

const args = process.argv.slice(2);

// --- simple arg parser ---
const flags = new Set(args.filter(a => a.startsWith("--")));
const getFlag = (name, fallback = false) =>
  flags.has(name) ? true : fallback;

const getValue = (name, def = undefined) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1]
    : def;
};

const pmExplicit =
  getFlag("--use-pnpm") ? "pnpm" :
  getFlag("--use-npm")  ? "npm"  :
  getFlag("--use-yarn") ? "yarn" : null;

let projectName = args.find(a => !a.startsWith("--"));
let projectDir;
const pkgManager  = pmExplicit || (process.env.npm_config_user_agent?.startsWith("pnpm") ? "pnpm"
                   : process.env.npm_config_user_agent?.startsWith("yarn") ? "yarn"
                   : "npm");

const useTS           = getFlag("--ts");
const useCore         = getFlag("--core");
const skipChromiumDL  = getFlag("--skip-chromium");
const initGit         = getFlag("--git");
const doInstall       = !getFlag("--no-install", false);
const withExample     = !getFlag("--no-example", false);
let packageName;

// --- templates ---
const gitignore = `
node_modules
.DS_Store
dist
.env
`.trimStart();

const tsconfig = JSON.stringify({
  compilerOptions: {
    target: "ES2022",
    module: "ES2022",
    moduleResolution: "Bundler",
    esModuleInterop: true,
    resolveJsonModule: true,
    strict: true,
    skipLibCheck: true,
    outDir: "dist",
    types: ["node"]
  },
  include: ["src"]
}, null, 2);

const jsExample = `import puppeteer from "${useCore ? "puppeteer-core" : "puppeteer"}";

(async () => {
  const browser = await puppeteer.launch(${useCore ? `{ headless: "new", executablePath: process.env.CHROME_PATH }` : `{ headless: "new" }`});
  const page = await browser.newPage();
  await page.goto("https://example.com");
  console.log("Title:", await page.title());
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
`;

const tsExample = `import puppeteer from "${useCore ? "puppeteer-core" : "puppeteer"}";

async function main() {
  const browser = await puppeteer.launch(${useCore ? `{ headless: "new", executablePath: process.env.CHROME_PATH as string }` : `{ headless: "new" }`});
  const page = await browser.newPage();
  await page.goto("https://example.com");
  console.log("Title:", await page.title());
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
`;

function makePackageJSON() {
  const isYarn = pkgManager === "yarn";
  const runNode = useTS ? (isYarn ? "tsx src/index.ts" : "tsx src/index.ts") : "node src/index.mjs";

  const scripts = {
    start: runNode,
    dev: runNode
  };

  const dependencies = useCore ? { "puppeteer-core": "latest" } : { puppeteer: "latest" };
  const devDependencies = useTS ? { "tsx": "latest", "@types/node": "latest", "typescript": "latest" }
                                : {};

  return JSON.stringify({
    name: packageName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts,
    dependencies,
    devDependencies
  }, null, 2);
}

// --- helpers ---
function promptForInput(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("close", (code) => {
      if (code === 0) resolve(0);
      else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function ensureDir(p) {
  if (!existsSync(p)) {
    await mkdir(p, { recursive: true });
  }
}

async function main() {
  // 0) prompt for project name if not provided
  if (!projectName) {
    projectName = await promptForInput("📁 Enter directory name for your Puppeteer app: ");
    if (!projectName) {
      console.error("❌ Directory name is required.");
      process.exit(1);
    }
  }
  
  projectDir = resolve(process.cwd(), projectName);
  packageName = getValue("--package-name", projectName.replace(/[^a-z0-9-_~.]/gi, "-").toLowerCase());
  
  // 1) create dir
  if (existsSync(projectDir) && existsSync(join(projectDir, "package.json"))) {
    console.error(`❌ Directory "${basename(projectDir)}" already contains a project.`);
    process.exit(1);
  }
  await ensureDir(projectDir);

  // 2) write files
  const srcDir = join(projectDir, "src");
  await ensureDir(srcDir);

  await writeFile(join(projectDir, "package.json"), makePackageJSON());
  await writeFile(join(projectDir, ".gitignore"), gitignore);

  if (useTS) {
    await writeFile(join(projectDir, "tsconfig.json"), tsconfig);
    await writeFile(join(srcDir, "index.ts"), withExample ? tsExample : "");
  } else {
    await writeFile(join(srcDir, "index.mjs"), withExample ? jsExample : "");
  }

  console.log(`\n📁 Created ${basename(projectDir)}\n`);
  console.log(`▶ Package manager: ${pkgManager}`);
  console.log(`▶ Template: ${useTS ? "TypeScript" : "JavaScript (ESM)"}`);
  console.log(`▶ Browser lib: ${useCore ? "puppeteer-core (bring your own Chrome)" : "puppeteer (bundled Chromium)"}`);
  if (useCore) {
    console.log("   Note: Set CHROME_PATH env var to your Chrome/Chromium executable.");
  }

  // 3) optionally init git
  if (initGit) {
    try {
      await run("git", ["init"], { cwd: projectDir });
      await run("git", ["add", "-A"], { cwd: projectDir });
      await run("git", ["commit", "-m", "chore: initial scaffold"], { cwd: projectDir });
      console.log("✅ Initialized git repo.");
    } catch {
      console.warn("⚠ Skipped git init (git not available?).");
    }
  }

  // 4) install
  if (doInstall) {
    const env = { ...process.env };
    if (skipChromiumDL) env.PUPPETEER_SKIP_DOWNLOAD = "1";

    const installCmd = pkgManager;
    const installArgs =
      pkgManager === "pnpm" ? ["install"] :
      pkgManager === "yarn" ? [] : // yarn v1 defaults to install
      ["install"];                  // npm install

    console.log("\n📦 Installing dependencies...");
    try {
      await run(installCmd, installArgs, { cwd: projectDir, env });
      console.log("✅ Install complete.");
    } catch (e) {
      console.warn("⚠ Dependency install failed. You can run it manually later.");
    }
  } else {
    console.log("⏭ Skipped dependency installation.");
  }

  // 5) next steps
  const enter = projectDir === process.cwd() ? "" : `cd ${JSON.stringify(projectDir)}\n`;
  const runCmd = useTS ? (pkgManager === "npm" ? "npm run dev" :
                          pkgManager === "pnpm" ? "pnpm dev" : "yarn dev")
                       : (pkgManager === "npm" ? "npm start" :
                          pkgManager === "pnpm" ? "pnpm start" : "yarn start");

  console.log(`\n🎉 All set! Next steps:\n\n${enter}${runCmd}\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
