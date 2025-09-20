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

import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";

const COPYRIGHT_COMMENT = `/*Stream Username Corrector\nCopyright (C) ${(new Date()).getFullYear()}  SpikyTater\n\nThis program is free software; you can redistribute it and/or modify\nit under the terms of the GNU General Public License as published by\nthe Free Software Foundation; either version 2 of the License, or\n(at your option) any later version.\n\nThis program is distributed in the hope that it will be useful,\nbut WITHOUT ANY WARRANTY; without even the implied warranty of\nMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\nGNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License along\nwith this program; if not, write to the Free Software Foundation, Inc.,\n51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.*/`;

const PLUGINS = [
  nodeResolve(),
];

const CONFIG = [
  {
    input: "./src/content_script.js",
    output: {
      file: "./build/cs_surface.js",
      format: "iife",
      compact: true,
    },
    plugins: PLUGINS
  },
  {
    input: "./src/content_script_deep.js",
    output: {
      file: "./build/cs_deep.js",
      format: "iife",
      compact: true,
    },
    plugins: PLUGINS
  },
  {
    input: "./src/popup.js",
    output: {
      file: "./build/popup.js",
      format: "iife",
      compact: true,
    },
    plugins: PLUGINS
  },
];

export default cmd_line_args => {
  if (!cmd_line_args.config_debug) {
    PLUGINS.push(terser({
      maxWorkers: 4,
      ecma: 2025,
      format: {
        ascii_only: true,
        comments: false,
        preamble: COPYRIGHT_COMMENT,
      },
      compress: {
     //   drop_console: ["log", "info"],
      }
    }));
  }
  return CONFIG;
};