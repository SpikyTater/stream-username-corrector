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

(() => {
  const poly = globalThis.browser || globalThis.chrome;
  poly.storage.local.get().then(result => {
    function f() {
      const USERNAMES_MAP = new Map();

      if (Object.hasOwn(result, "#")) {
        document.getElementById("show-original").checked = !!parseInt(result["#"]);
        delete result["#"];
      }

      for (const k in result) {
        USERNAMES_MAP.set(k, JSON.parse(result[k]));
      }

      const USERNAMES_MAP_SORTED = new Map([...USERNAMES_MAP].sort((a, b) => String(a[0]).localeCompare(b[0])));

      function AddNicknameToUi(parent, nickname, username) {
        const cont = document.createElement("div");
        cont.className = "user-nick-cont";

        const name = document.createElement("span");
        name.textContent = nickname;
        name.className = "user-nick";

        const del_btn = document.createElement("button");
        del_btn.className = "user-nick-btn-del";
        del_btn.innerHTML = "Delete&nbsp;nickname";
        del_btn.setAttribute("data-user", username);
        del_btn.setAttribute("data-nick", nickname);

        cont.append(name, del_btn);
        parent.append(cont);
      }

      function CreateTableForUser(parent, username, ...nicknames) {
        const outer = document.createElement("div");
        outer.className = "user-outer";

        const top = document.createElement("div");
        top.className = "user-top";

        const user_del_btn = document.createElement("button");
        user_del_btn.innerHTML = "Delete&nbsp;user";
        user_del_btn.className = "user-btn-del";
        user_del_btn.setAttribute("data-user", username);

        const title = document.createElement("h2");
        title.textContent = username;

        const nicknames_outer = document.createElement("div");
        nicknames_outer.className = "user-nicks-outer";

        const nicknames_inner = document.createElement("div");
        nicknames_inner.className = "user-nicks-inner";

        const adder_outer = document.createElement("div");
        adder_outer.className = "user-nicks-adder-outer";

        const input = document.createElement("input");
        input.className = "user-nicks-input";
        input.type = "text";
        input.setAttribute("data-user", username);

        const button = document.createElement("button");
        button.className = "user-nicks-btn-add";
        button.innerHTML = "Add&nbsp;nickname";
        button.setAttribute("data-user", username);

        nicknames.sort();

        for (const nickname of nicknames) {
          AddNicknameToUi(nicknames_inner, nickname, username);
        }

        adder_outer.append(input, button);
        nicknames_outer.append(nicknames_inner, adder_outer);
        top.append(title, user_del_btn);
        outer.append(top, nicknames_outer);
        parent.append(outer);
      }

      const fragment = new DocumentFragment();

      for (const [key, value] of USERNAMES_MAP_SORTED) {
        if (!Array.isArray(value)) continue;
        CreateTableForUser(fragment, key, ...value);
      }

      document.getElementById("users").append(fragment);

      function SaveUser(username) {
        const o = {};
        o[username] = `[${USERNAMES_MAP_SORTED.get(username).map(s => `"${s}"`).join(",")}]`;
        poly.storage.local.set(o);
      }

      function DeleteUser(username) {
        poly.storage.local.remove(username);
      }

      /**
       * @param {string} username 
       * @param {HTMLInputElement} input 
       */
      function HandleAddNickname(username, input) {
        if (!input.value || !(typeof input.value === "string" || input.value instanceof String)) return;
        let nickname = input.value;
        input.value = "";
        if (!nickname.length) return;

        const arr = USERNAMES_MAP_SORTED.get(username);
        if (arr.includes(nickname)) return;
        arr.push(nickname);

        AddNicknameToUi(input.parentElement.previousElementSibling, nickname, username);
        SaveUser(username);
      }

      /**
       * @param {HTMLInputElement} input 
       */
      function HandleAddUser(input) {
        if (!input.value || !(typeof input.value === "string" || input.value instanceof String)) return;
        let username = input.value;
        if (!username.length) return;
        input.value = "";
        username = username.toLowerCase();

        if (USERNAMES_MAP_SORTED.has(username)) return;
        USERNAMES_MAP_SORTED.set(username, []);

        CreateTableForUser(document.getElementById("users"), username);
        SaveUser(username);
      }

      window.addEventListener("click", e => {
        if (!e || !e.target) return;
        const t = e.target;
        if (!t.tagName || t.tagName.toLowerCase() !== "button") return;

        switch (t.className) {
          case "user-nick-btn-del": {
            const username = t.getAttribute("data-user");
            const nickname = t.getAttribute("data-nick");
            const arr = USERNAMES_MAP_SORTED.get(username);

            const idx = arr.indexOf(nickname);

            arr.splice(idx, 1);
            t.parentElement.remove();
            SaveUser(username);
            return;
          }
          case "user-btn-del": {
            const username = t.getAttribute("data-user");

            USERNAMES_MAP_SORTED.delete(username);

            t.parentElement.parentElement.remove();
            DeleteUser(username);
            return;
          }
          case "user-nicks-btn-add": {
            HandleAddNickname(t.getAttribute("data-user"), t.previousElementSibling);
            return;
          }
        }

        switch (t.id) {
          case "username-adder": {
            HandleAddUser(t.previousElementSibling);
            return;
          }
        }
      });

      window.addEventListener("keyup", e => {
        if (!e?.repeat && "Enter" !== e.key) return;
        const t = e.target;
        console.log({ TTT: t })
        if (!t) return;
        if ("input" !== t.tagName.toLowerCase()) return;

        if ("username-adder-input" === t.id) {
          HandleAddUser(t);
        } else if ("user-nicks-input" === t.className) {
          HandleAddNickname(t.getAttribute("data-user"), t);
        }
      });

      document.getElementById("show-original").addEventListener("change", e => {
        if (!e) return;
        const t = e.target, o = {};
        if (!t) return;
        o["#"] = t.checked ? 1 : 0;
        poly.storage.local.set(o);
      });
    }

    if ("loading" === document.readyState)
      window.addEventListener("DOMContentLoaded", f, { once: true, passive: true });
    else f();
  });
})()