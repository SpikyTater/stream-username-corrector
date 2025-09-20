/*Stream Username Corrector
Copyright (C) 2025  SpikyTater

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.*/

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import process from "process";
import { Zip, Unzip } from "zip-lib";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

const MANIFEST = {
  name: "__MSG_ext_name__",
  version: pkg.version,
  manifest_version: 3,
  default_locale: "en",
  description: "__MSG_ext_desc__",
  permissions: [
    "storage",
  ],
  icons: {
    "16": "a.png",
    "32": "b.png",
    "48": "c.png",
    "128": "d.png"
  },
  action: {
    "default_icon": {
      "16": "a.png",
      "32": "b.png",
      "48": "c.png",
      "128": "d.png"
    },
    default_title: "Stream Username Corrector",
    default_popup: "popup.html",
  },
  host_permissions: [
    "*://*.twitch.tv/*",
  ],
  content_scripts: [
    {
      run_at: "document_start",
      exclude_matches: [
        "*://*.twitch.tv/moderator/*"
      ],
      matches: [
        "*://*.twitch.tv/*"
      ],
      js: [
        "cs_surface.js"
      ],
      world: "ISOLATED",
    },
    {
      run_at: "document_idle",
      exclude_matches: [
        "*://*.twitch.tv/moderator/*"
      ],
      matches: [
        "*://*.twitch.tv/*"
      ],
      js: [
        "cs_deep.js"
      ],
      world: "MAIN",
    },
  ],
};

const CHROME_MANIFEST_ADDENDUM = {};
const FIREFOX_MANIFEST_ADDENDUM = {};

const CHROME_MANIFEST = Object.assign({}, MANIFEST, CHROME_MANIFEST_ADDENDUM);
const FIREFOX_MANIFEST = Object.assign({}, MANIFEST, FIREFOX_MANIFEST_ADDENDUM);

const DIST_DIR = "./dist";
const BUILD_DIR = "./build/";
const RELEASES_DIR = `${BUILD_DIR}releases/`;
const LOCALES_DIR = `${BUILD_DIR}_locales/`;

const CHROME_MANIFEST_PATH = `${BUILD_DIR}chrome_manifest.json`;
const FIREFOX_MANIFEST_PATH = `${BUILD_DIR}firefox_manifest.json`;

/**
 * @param {string} build_name 
 * @returns {string}
 */
function GetPathFromBuildName(build_name) {
  return `${RELEASES_DIR}${pkg.name}_${build_name}.zip`;
}

/**
 * @param {boolean} is_dev_build 
 * @param {string} build_name 
 * @param {string} manifest_path 
 */
function CreateReleaseZip(is_dev_build, build_name, manifest_path) {
  const zip = new Zip({ compressionLevel: is_dev_build ? 0 : 9 });

  zip.addFile(manifest_path, "manifest.json");
  zip.addFolder(LOCALES_DIR, "_locales");
  zip.addFile(`${BUILD_DIR}cs_surface.js`);
  zip.addFile(`${BUILD_DIR}cs_deep.js`);
  zip.addFile(`${BUILD_DIR}popup.js`);
  if (is_dev_build) {
    zip.addFile("./src/popup.html", "popup.html");
  } else {
    zip.addFile(`${BUILD_DIR}popup.html`);
  }
  zip.addFile(`${BUILD_DIR}popup.css`);

  [
    [16, "a"],
    [32, "b"],
    [48, "c"],
    [128, "d"]
  ].forEach(([size, letter]) => {
    zip.addFile(`./assets/logo_${size}.png`, `${letter}.png`);
  });

  zip.archive(GetPathFromBuildName(build_name));
}

/**
 * @returns {boolean}
 */
function CreateBuildDirs() {
  if (!existsSync(RELEASES_DIR)) {
    mkdirSync(RELEASES_DIR, { recursive: true });
  }

  if (!existsSync(LOCALES_DIR)) {
    mkdirSync(LOCALES_DIR, { recursive: true });
  }

  if (!existsSync(RELEASES_DIR)) {
    console.error("Couldn't create build directory.");
    process.exitCode = 1;
    return true;
  }

  if (!existsSync(LOCALES_DIR)) {
    console.error("Couldn't create build/locales directory.");
    process.exitCode = 1;
    return true;
  }

  return false;
}

/**
 * @param {boolean} is_dev_build 
 */
function CreateLocales(is_dev_build) {
  const all_files = readdirSync("./_locales", { encoding: "utf8", recursive: true, withFileTypes: true });
  for (const file of all_files) {
    if (file.isDirectory()) {
      mkdirSync(`${LOCALES_DIR}${file.name}`, { recursive: true });
    } else if (file.isFile()) {
      if ("messages.json" === file.name) {
        let o;
        try {
          o = JSON.parse(readFileSync(`${file.parentPath}/messages.json`, { encoding: "utf8" }));
        } catch (e) {
          console.error(e);
        }
        if (o) {
          writeFileSync(`${BUILD_DIR}${file.parentPath}/messages.json`, JSON.stringify(o, null, is_dev_build ? 2 : 0));
        }
      }
    }
  }
}

/**
 * @param {boolean} is_dev_build 
 */
function CreateManifests(is_dev_build) {
  const CHROME_MANIFEST_STR = JSON.stringify(CHROME_MANIFEST, null, is_dev_build ? 2 : 0);
  const FIREFOX_MANIFEST_STR = JSON.stringify(FIREFOX_MANIFEST, null, is_dev_build ? 2 : 0);

  writeFileSync(CHROME_MANIFEST_PATH, CHROME_MANIFEST_STR);
  writeFileSync(FIREFOX_MANIFEST_PATH, FIREFOX_MANIFEST_STR);
}

/**
 * @param {boolean} is_dev_build 
 */
function Build(is_dev_build) {
  if (CreateBuildDirs()) {
    return;
  }

  CreateManifests(is_dev_build);
  CreateLocales(is_dev_build);

  CreateReleaseZip(is_dev_build, "chrome", CHROME_MANIFEST_PATH);
  CreateReleaseZip(is_dev_build, "firefox", FIREFOX_MANIFEST_PATH);
}

switch (process.argv[2]) {
  case "build": Build(false); break;
  case "build:dev": Build(true); break;
  case "clean": {
    let did_clean = false;

    if (existsSync(BUILD_DIR)) {
      rmSync(BUILD_DIR, { recursive: true });
      did_clean = true;
    }

    if (existsSync(DIST_DIR)) {
      rmSync(DIST_DIR, { recursive: true });
      did_clean = true;
    }

    console.log(did_clean ? "Cleaning successful." : "No cleaning was needed.");
    break;
  }
  case "dist:chrome": {
    if (!existsSync(DIST_DIR)) {
      mkdirSync(DIST_DIR, { recursive: true });
    }
    if (!existsSync(DIST_DIR)) {
      console.error("Couldn't create dist directory.");
      process.exitCode = 1;
      break;
    }

    const unzip = new Unzip();
    unzip.extract(GetPathFromBuildName("chrome"), DIST_DIR);

    break;
  }
}