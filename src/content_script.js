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

(async () => {
  const poly = globalThis.browser || globalThis.chrome;

  function SendMessageToDeep(...data) {
    const message = [654321, ...data]
    window.postMessage(message);
  }

  function ParseStorageObject(o, is_not_change) {
    if (Object.hasOwn(o, "#")) {
      const x = o["#"];
      SendMessageToDeep(1, parseInt(is_not_change ? x : x.newValue));
      delete o["#"];
    }

    let n = 0;
    for (const k in o) {
      const v = o[k];
      n++;
      if (is_not_change) {
        o[k] = JSON.parse(v);
      } else if (Object.hasOwn(v, "newValue")) {
        o[k] = JSON.parse(v.newValue);
      } else {
        o[k] = [];
      }
    }

    if (n) {
      SendMessageToDeep(0, o);
    }
  }

  function OnMessage({ origin, data }) {
    if ("https://www.twitch.tv" !== origin
      || !Array.isArray(data)
      || data.length < 2
      || data[0] !== 123456) {
      return;
    }

    switch (data[1]) {
      case 0:
        // deep content script has finished loading
        // message listener here is no longer needed
        window.removeEventListener("message", OnMessage);

        poly.storage.local.get(null, result => {
          ParseStorageObject(result, true);
          poly.storage.local.onChanged.addListener(ParseStorageObject);
        });

        return;
      default:
        console.error("UNKNOWN MESSAGE:", { data });
        return;
    }
  }

  window.addEventListener("message", OnMessage);
})();