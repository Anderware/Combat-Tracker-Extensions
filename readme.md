[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ramses800) ![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/Anderware/Combat-Tracker-Extensions/latest/combat-tracker-extensions.zip?style=for-the-badge)
![](https://dcbadge.vercel.app/api/shield/783401137281564692)
# Combat Tracker Extensions

A system-agnostic FoundryVTT module for modifying and extending the standard Combat Tracker

## Feature Summary

- Combatant name masking - hides token name in Combat Tracker from non-GMs
- Obscures/hide combatant information/entry for non-GMs in Combat Tracker based on
  - Module current settings
  - NPC/Player token
  - Token disposition
  - Token current visibility for current player
  - Token ownership
- Automatically set added combatants to hidden/name masked
- Change token disposition/visibility from Combat Tracker
- Reverse initiative order
- Custom defined combat phases
- Multiple combatants for the same token
- Quick input field to modify current initiative value
- Show combatant disposition by color indication
- Show token actor portrait instead of token portrait
- All features optional and configurable

### Demo screen

In the screenshot below, to the left is the GMs screen, to the right is the player Albans screen.
Alban can not see Orc Shaman(invisible) or Orc Archer 2(blocked line of sight)

![Demo](./resources/demo_screen_1.jpg)

### Demo combatant context menu

![Demo Context Menu](./resources/demo_screen_2.jpg)

## Module Compatibility

Foundry version 10, 11

## Module Features

### Phases

This feature divides the Combat Tracker into phases which each has its own initiative order.

Use the Phase Editor on the Configure Game Settings to define custom phases.

![Phase Editor](./resources/phase-editor-basic.jpg)

## Module Settings
### Combat Tracker Options
Options for Combat Tracker
#### Enable phases
Enables custom defined phases for the combat tracker. Each phase has its own initiative order. Adds context menu items in the Combat Tracker that allows for changing the phase of a combatant token. 
#### Enable obscure combatant
When checked, the Combat Tracker will display combatants/information based on module settings and ownership. Applies for non-GMs only.
#### Add NPC combatants as hidden
When checked, adding a NPC token to the Combat Tracker will be added as hidden.
#### Enable name masking
When checked, GMs can toggle masking the name of combatants for non-GMs in the Combat Tracker.
#### Add NPC combatants with name masked
When checked, adding a NPC token to the Combat Tracker will have its name masked for non-GMs. Only used if[Enable name masking] is checked.
#### Enable visibility toggle
When checked, GMs can toggle visibility of the combatant token in the Combat Tracker.
#### Reverse initiative
Reverse the sorting order for initiative so that lowest goes first.
#### Duplicate combatant
Add a 'Duplicate Combatant' context menu item in the Combat Tracker that allows each token to have multiple combatants to give the possibility to get multiple actions in the same round.
#### Enable disposition change
Adds context menu items in the Combat Tracker that allows for changing the disposition of a combatant token. Applies for GMs only.
#### Initiative input field
Replace the normal initiative value with a number input field.
#### Minimum initiative input allowed
The minimum number that can be entered into the initiative input field.
#### Maximum initiative input allowed
The maximum number that can be entered into the initiative input field.
#### Use actor portraits for GMs
When checked, the Combat Tracker will use the token actors portrait as image instead of the token image. Applies for GMs only.
#### Use actor portraits for players
When checked, the Combat Tracker will use the token actors portrait as image instead of the token image. Applies for non-GMs only.
#### Show disposition for GMs
When checked, the Combat Tracker will indicate by color the disposition of the combatant. Applies for GMs only.
#### Show disposition for players
When checked, the Combat Tracker will indicate by color the disposition of the combatant. Applies for non-GMs only.
#### Obscure combatant by visibility
When checked, the Combat Tracker will only display combatants that has token visible for the user. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Obscure combatant by disposition
When checked, the Combat Tracker will display combatants/information for tokens based on their disposition and current settings. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show FRIENDLY combatants initiative
If unchecked, combatants with FRIENDLY token disposition will not show their initiative value in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show NEUTRAL combatants initiative
If unchecked, combatants with NEUTRAL token disposition will not show their initiative value in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show HOSTILE combatants initiative
If unchecked, combatants with HOSTILE token disposition will not show their initiative value in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show SECRET combatants initiative
If unchecked, combatants with SECRET token disposition will not show their initiative value in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show FRIENDLY combatants
If unchecked, combatants with FRIENDLY token disposition will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show NEUTRAL combatants
If unchecked, combatants with NEUTRAL token disposition will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show HOSTILE combatants
If unchecked, combatants with HOSTILE token disposition will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show SECRET combatants
If unchecked, combatants with SECRET token disposition will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show NPCs combatants
If unchecked, NPC combatants will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
#### Show non-NPCs combatants
If unchecked, non-NPC combatants will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.

## Source code used

Combat Tracker Extension is built on a base from  [Reverse Initiative Order](https://github.com/sun-dragon-cult/fvtt-module-reverseinitiativeorder) by [Åke Wivänge](https://github.com/wake42)

## License

Module development according to Foundry Virtual Tabletop [Limited License Agreement for Module Development](https://foundryvtt.com/article/license)

This module is licensed by [Ramses800](https://github.com/Anderware/Foundry-Vtt-Sandbox-Macros) under [AGPL-3.0](https://opensource.org/licenses/AGPL-3.0)

