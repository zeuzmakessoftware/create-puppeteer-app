# create-puppeteer-app

⚡️ Quickly scaffold a new [Puppeteer](https://pptr.dev/) project in no time.
Think of it as `create-next-app`, but for Puppeteer.

```bash
npx create-puppeteer-app my-scraper --use-pnpm
```

This sets up:

* 📦 A fresh project folder with `package.json`
* 📝 Example script (`index.mjs` or `index.ts`)
* 🔧 Puppeteer (or `puppeteer-core`) installed
* 🛠 Optional TypeScript support
* 🐙 Optional Git repo initialization

---

## 🚀 Quick Start

### JavaScript + Puppeteer (default)

```bash
npx create-puppeteer-app my-scraper --use-pnpm
cd my-scraper
pnpm start
```

### TypeScript + puppeteer-core (bring your own Chrome)

```bash
npx create-puppeteer-app my-ts-scraper --ts --core --use-pnpm
cd my-ts-scraper
# point to your Chrome if needed:
# export CHROME_PATH="/path/to/chrome"
pnpm dev
```

---

## ⚙️ CLI Options

| Flag              | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| `--use-pnpm`      | Use pnpm as package manager (default auto-detects)                            |
| `--use-npm`       | Use npm as package manager                                                    |
| `--use-yarn`      | Use Yarn as package manager                                                   |
| `--ts`            | Use TypeScript template (with `tsx` + `tsconfig.json`)                        |
| `--core`          | Use `puppeteer-core` instead of `puppeteer` (requires system Chrome/Chromium) |
| `--skip-chromium` | Skip Chromium download during install                                         |
| `--git`           | Initialize a git repo with first commit                                       |
| `--no-install`    | Skip installing dependencies                                                  |
| `--no-example`    | Don’t include an example script (empty `src/`)                                |
| `--package-name`  | Override package name in `package.json`                                       |

---

## 🧩 Example Script

The default scaffold gives you a working script out of the box:

```js
import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto("https://example.com");
  console.log("Title:", await page.title());
  await browser.close();
})();
```

Run it with:

```bash
pnpm start
```

---

## 📖 Why?

Setting up Puppeteer can be repetitive:

* Create a project folder
* Add `package.json`
* Install `puppeteer`
* Write boilerplate script

`create-puppeteer-app` does all of this in seconds — so you can focus on building your automation or scraper.

---

## 🛠 Development

Clone and link locally:

```bash
git clone https://github.com/yourname/create-puppeteer-app.git
cd create-puppeteer-app
npm link
```

Now test it:

```bash
create-puppeteer-app test-app --use-pnpm
```