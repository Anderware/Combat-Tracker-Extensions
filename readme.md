[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ramses800) ![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/Anderware/Combat-Tracker-Extensions/latest/combat-tracker-extensions.zip?style=for-the-badge)

# Combat Tracker Extensions

A system-agnostic FoundryVtt module for modifying and extending the standard Combat Tracker

## Features

- Combatant name masking - hides token name from non-GMs
- Obscures combatant information for non-GMs based on
  - Module current settings
  - NPC/Player token
  - Token disposition
  - Token current visibility for current player
  - Token ownership
- Reverse initiative order
- Custom defined combat phases
- Multiple combatants for the same token
- Quick input field to modify current initiative value
- Show combatant disposition by color indication
- Show token actor portrait instead of token portrait
- All features optional and configurable

## Module Compability

Foundry version 10, 11

# Settings
## Combat Tracker Options
Options for Combat Tracker
### Enable obscure combatant
When checked, the Combat Tracker will display combatants/information based on module settings and ownership. Applies for non-GMs only.
### Add NPC combatants as hidden
When checked, adding a NPC token to the Combat Tracker will be added as hidden.
### Enable name masking
When checked, GMs can toggle masking the name of combatants for non-GMs in the Combat Tracker.
### Add NPC combatants with name masked
When checked, adding a NPC token to the Combat Tracker will have its name masked for non-GMs.
### Reverse initiative
Reverse the sorting order for initiative so that lowest goes first.
### Enable phases
Enables custom defined phases for the combat tracker.
Adds context menu items in the Combat Tracker that allows for changing the phase of a combatant token. 

### Defined phases
Custom defined phases for the combat tracker. A string with a valid JSON expression. Example:

```
 {"phases":[{"name":"Magic","icon":"fa-sparkles"},{"name":"Missile","icon":"fa-bullseye"},{"name":"Melee","icon":"fa-swords"},{"name":"Manoeuvers","icon":"fa-person-walking"}]}
```

### Duplicate combatant
Add a 'Duplicate Combatant' context menu item in the Combat Tracker that allows each token to have multiple combatants to give the possibility to get multiple actions in the same round.
### Enable disposition change
Adds context menu items in the Combat Tracker that allows for changing the disposition of a combatant token. Applies for GMs only.
### Initiative input field
Replace the normal initiative value with a number input field.
### Minimum initiative input allowed
The minimum number that can be entered into the initiative input field.
### Maximum initiative input allowed
The maximum number that can be entered into the initiative input field.
### Use actor portraits for GMs
When checked, the Combat Tracker will use the token actors portrait as image instead of the token image. Applies for GMs only.
### Use actor portraits for players
When checked, the Combat Tracker will use the token actors portrait as image instead of the token image. Applies for non-GMs only.
### Show disposition for GMs
When checked, the Combat Tracker will indicate by color the disposition of the combatant. Applies for GMs only.
### Show disposition for players
When checked, the Combat Tracker will indicate by color the disposition of the combatant. Applies for non-GMs only.
### Obscure combatant by visibility
When checked, the Combat Tracker will only display combatants that has token visible for the user. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Obscure combatant by disposition
When checked, the Combat Tracker will display combatants/information for tokens based on their disposition and current settings. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show FRIENDLY combatants initiative
If unchecked, combatants with FRIENDLY token disposition will not show their initiative value in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show NEUTRAL combatants initiative
If unchecked, combatants with NEUTRAL token disposition will not show their initiative value in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show HOSTILE combatants initiative
If unchecked, combatants with HOSTILE token disposition will not show their initiative value in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show SECRET combatants initiative
If unchecked, combatants with SECRET token disposition will not show their initiative value in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show FRIENDLY combatants
If unchecked, combatants with FRIENDLY token disposition will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show NEUTRAL combatants
If unchecked, combatants with NEUTRAL token disposition will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show HOSTILE combatants
If unchecked, combatants with HOSTILE token disposition will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show SECRET combatants
If unchecked, combatants with SECRET token disposition will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show NPCs combatants
If unchecked, NPC combatants will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.
### Show non-NPCs combatants
If unchecked, non-NPC combatants will not be shown in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only.

## Source code used

Combat Tracker Extension is built on a base from  [Reverse Initiative Order](https://github.com/sun-dragon-cult/fvtt-module-reverseinitiativeorder) by [Åke Wivänge](https://github.com/wake42)

## License

Module development according to Foundry Virtual Tabletop [Limited License Agreement for Module Development](https://foundryvtt.com/article/license)

This module is licensed by [Ramses800](https://github.com/Anderware/Foundry-Vtt-Sandbox-Macros) under [AGPL-3.0](https://opensource.org/licenses/AGPL-3.0)

