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
  const USERNAMES_MAP = new Map();

  let show_real_username = false;
  let is_message_handler_unset = true;

  function handle_error(...s) {
    if (s.length) {
      console.error(...s);
    }
  }

  let message_handler_api;
  outer: for (let tries = 0; tries < 100; tries++) {
    do {
      const el = document.querySelector('[data-test-selector="chat-room-component-layout"]');
      if (!el) break;

      let react_node;
      for (const k in el) {
        if (k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')) {
          react_node = el[k];
          break;
        }
      }

      while (react_node) {
        if (react_node.stateNode?.props?.messageHandlerAPI) {
          message_handler_api = react_node.stateNode.props.messageHandlerAPI;
          break outer;
        }
        react_node = react_node.return;
      }
    } while (false);

    await new Promise(r => setTimeout(r, 200));
  }

  if (!message_handler_api?.addMessageHandler) {
    handle_error();
    return;
  }

  function NicknamesMessageHandler(e) {
    if (!e || e.type !== 0 || !Object.hasOwn(e, "user")) {
      return;
    }

    const { user } = e, curr_username = user.isIntl ? user.userLogin : user.userDisplayName;

    const nicknames = USERNAMES_MAP.get(curr_username.toLowerCase());
    if (!Array.isArray(nicknames) || 0 === nicknames.length) {
      return;
    }

    user.userDisplayName = nicknames.length > 1 ? nicknames[Math.random() * nicknames.length | 0] : nicknames[0];

    if (show_real_username) {
      user.isIntl = true;
      user.userLogin = curr_username;
    }
  }

  function SendMessageToSurface(...data) {
    const message = [123456, ...data]
    window.postMessage(message);
  }

  function OnMessage({ origin, data }) {
    if ("https://www.twitch.tv" !== origin
      || !Array.isArray(data)
      || data.length < 2
      || data[0] !== 654321) {
      return;
    }

    switch (data[1]) {
      case 0: {
        // all nicknames, straight from settings
        const o = data[2];

        for (const k in o) {
          const v = o[k];
          if (!Array.isArray(v)) {
            handle_error("Malformed data.");
            continue;
          }

          if (!v.length) {
            continue;
          }

          USERNAMES_MAP.set(k.toLowerCase(), v);
        }

        if (is_message_handler_unset) {
          is_message_handler_unset = false;
          message_handler_api.addMessageHandler(NicknamesMessageHandler);
        }
        return;
      }
      case 1: {
        show_real_username = data[2];
        return;
      }
      default:
        handle_error("UNKNOWN MESSAGE:", { data });
        return;
    }

  }

  window.addEventListener("message", OnMessage);
  SendMessageToSurface(0);
})();
