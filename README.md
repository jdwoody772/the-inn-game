# The Inn - The Story Begins

This packet contains the current playable browser build and the square Game Boy-style cover art for the Pure Unfiltered Chaos site.

| File | Use |
| --- | --- |
| `The-Inn-Cover.png` | Clickable cover art for the Fourthwall page |
| `game/index.html` | Standalone game entry point and editable source |
| `game/the-inn-theme.wav` | Music loaded by the game. Keep it beside `index.html` |
| `game/the-inn-theme.mid` | MIDI source for the theme |

## Handoff for Codex

Use the Fourthwall page editor open on my Mac for the Pure Unfiltered Chaos website. Add `The-Inn-Cover.png` as a clickable image for **The Inn - The Story Begins**. Use “Play The Inn - The Story Begins” as its alt text if the editor supports it. Link directly to the public standalone story build and verify the image, link, and mobile layout in the editor preview.

The current deployed story build is https://the-inn-gb.richmyrrh4.chatgpt.site/ and is restricted to its owner account. A link to that build will work for the owner but visitors will not be able to play. Use a publicly accessible game URL for the published link. If a public URL is not yet available, prepare the cover tile in the editor and report the access blocker. The supplied `game/` files can be deployed together to static web hosting. Verify access in a signed-out browser before publishing the Fourthwall page. Preserve the page’s other content and existing links.

For the visitor link, use the build’s root URL with no query parameters. It opens on the title screen, then starts the story at the inn. The `?mill=15` link is a separate boss test that starts with the Grass Bow and bypasses story saves; do not use that as the visitor link. Story saves are stored by browser and website origin. Saves from the existing host do not transfer automatically to a new host.

## Check the packaged build

From inside `game/`, run `python3 -m http.server 8000` and open `http://localhost:8000/`. Keep the game files under the same web directory when deploying. Confirm New Game, keyboard and touch controls, music playback, and that Continue appears after a reload. The game has no backend or build step.
