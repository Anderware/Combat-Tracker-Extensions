# Combat Tracker Extensions

A FoundryVtt module for extending the Combat Tracker

## Features

- Combatant name masking - hides token name from non-GMs
- Obscures combatant information for non-Gms based on
  - Token disposition
  - Token current visibility for current player
  - Token ownership
- Reverse initiative order
- Multiple combatants for the same token
- Quick input field to modify current initiative value

## Compability

Foundry version 10,11

## Combat Tracker Options
Options for Combat Tracker
### Enable name masking
When checked, GMs can toggle masking the name of combatants for non-Gms in the Combat Tracker.
### Add combatants with name masked
When checked, adding a NPC token to the Combat Tracker will have its name masked for non-GMs.
### Add combatants as hidden
When checked, adding a NPC token to the Combat Tracker will be added as hidden.
### Obscure combatant
When checked, the Combat Tracker will display token/information on NPC tokens based their disposition, visibility and ownership. Applies for non-GMs only.
### Show disposition for GMs
When checked, the Combat Tracker will indicate by color the disposition of the combatant.
### Show disposition for players
When checked, the Combat Tracker will indicate by color the disposition of the combatant.
### Reverse initiative
Reverse the sorting order for initiative so that lowest goes first.
### Duplicate combatant
Add a 'Duplicate Combatant' context menu item in the Combat Tracker that allows each token to have multiple combatants to give the possibility to get multiple actions in the same round.
### Initiative input field
Replace the normal initiative value with an input field
### Minimum initiative input allowed

### Maximum initiative input allowed

## Source code used

Combat Tracker Extension is built on a base from  [Reverse Initiative Order](https://github.com/sun-dragon-cult/fvtt-module-reverseinitiativeorder) by [Åke Wivänge](https://github.com/wake42)

## License

Module development according to Foundry Virtual Tabletop [Limited License Agreement for Module Development](https://foundryvtt.com/article/license)

This module is licensed by [Ramses800](https://github.com/Anderware/Foundry-Vtt-Sandbox-Macros) under [AGPL-3.0](https://opensource.org/licenses/AGPL-3.0)

