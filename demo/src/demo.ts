const glob = require("glob");
const express = require("express");
const app = express();
const { readFileSync, statSync } = require("fs");

process.chdir("..");
const { DIST_NAME } = require("../../webpack.common");
const { entry } = require("../../webpack.config");
process.chdir("./demo");

const getPort = (port: number) => {
  if (statSync("../demo.port")) {
    try {
      port = parseInt(readFileSync("../demo.port"));
    } catch (ex) {
      console.log(ex);
    }
  }
  if (process.env.SITE_PORT) {
    try {
      port = parseInt(process.env.SITE_PORT);
    } catch (ex) {
      // Suppress exception
      console.log("Exception parsing SITE_PORT: ", ex);
    }
  }
  const args = process.argv.slice(2);
  if (args.length > 0) {
    try {
      port = parseInt(args[0]);
    } catch (ex) {
      // Suppress exception
      console.log("Exception parsing site port from first argument: ", ex);
    }
  }
  return port;
};
const port = getPort(3000);

const getRootPath = () => {
  if (process.env.SITE_ROOT) {
    return process.env.SITE_ROOT;
  }
  return "";
};
const root = getRootPath();

async function getDemos(): Promise<string[]> {
  return new Promise((respond, reject) => {
    glob("../www/*.html", {}, function (err: any, files: string[]) {
      if (err) {
        reject(err);
      }
      // files is an array of filenames.
      respond(
        files.map((file: string) => {
          const m = file.match(/www\/(\w+)\.html/);
          [1];
          return m ? m[1] : null;
        })
      );
    });
  });
}

app.get(root, async (req: any, res: any) => {
  let resp = "";
  const write = (text: any) => {
    resp += text + "\n";
  };

  write(`<!DOCTYPE html>`);
  write(`<html>`);
  write(`<head>`);
  write(`<title>${DIST_NAME}</title>`);
  write(`</head>`);
  write(`<body>`);
  write(
    `<h1>${DIST_NAME} <a href='${root}/coverage/lcov-report/'>Coverage</a> <a href='${root}/docs'>Docs</a></h1>`
  );
  write(
    `<p>This library is available as a <a href="${root}/src/index.js">JavaScript UMD module</a></p>`
  );
  write(`<h2>Samples &amp; Demos</h2>`);
  write(`<ul>`);
  Object.keys(entry).forEach((demo) => {
    demo && write(`<li><a href='${root}/${demo}.html'>${demo}</li>`);
  });
  write(`</ul>`);
  write(`</body>`);
  write(`</html>`);

  res.end(resp);
});

app.get(root + "/*.html", (req: any, res: any) => {
  let resp = "";
  const write = (text: any) => {
    resp += text + "\n";
  };

  const demo = req.path.match(/([^/]+)\.html$/)[1];

  write(`<!DOCTYPE html>`);
  write(`<html lang="en">`);
  write(`<head>`);
  write(`<meta charset="UTF-8">`);
  write(`<meta http-equiv="X-UA-Compatible" content="IE=edge">`);
  write(
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
  );
  write(`<title>${demo}</title>`);
  write(`<style>`);
  write(`body {margin: 0;padding: 0;}`);
  write(`.parsegraph_Window {width: 100vw;height: 100vh;}`);
  write(`</style>`);
  write(`</head>`);
  write(`<body>`);
  write(`<div style="width: 100vw; height: 100vh">`);
  write(`<div style="width: 100%; height: 100%" id="demo"></div>`);
  write(`</div>`);
  write(`<script src="parsegraph-log.js"></script>`);
  write(`<script src="parsegraph-checkglerror.js"></script>`);
  write(`<script src="src/${demo}.js"></script>`);
  write(`</body>`);
  write(`</html>`);
  res.end(resp);
});

app.use(root, express.static("../src"));
app.use(root, express.static("../dist"));
app.use(root, express.static("../www"));

app.listen(port, () => {
  console.log(
    `See ${DIST_NAME} build information at http://localhost:${port}${root}`
  );
});
