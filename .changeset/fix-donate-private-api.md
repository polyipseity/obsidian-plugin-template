---
"PLACEHOLDER": patch
---

Fix the donate button and "open documentation (donate)" command failing with an error on Obsidian 1.12.7+ due to a private API change. The plugin now finds the donation button directly from the community plugins list and falls back to opening the donation URL when that is not possible.
