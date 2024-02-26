# Combat Tracker Extensions Change Log
## Version 1.3(2024-02-26)
- Added option "Unset phase name","The name(caption) to be shown for the Unset phase"
- Added option "Enable phase assignment random","When checked, the Phase Assignment dropdown will have a entry for randomly selecting a unset combatant." 
- Added combatant command "Set combatant to current"
- Added option "Enable base menu commands", "Enable base dropdown menu commands." Function was there before, but not optional.
- Added base menu command "Select"
- Added option "Enable combatants groups","Enable grouping of combatants."
- Added option "New groups shares initiative", "When checked, new groups will be created with Shared Initiative enabled as default. Only used if [Enable combatants groups] is enabled"
- Added option "Hide players combatants initiative","If checked, player combatants will not show their initiative value in the Combat Tracker. Only used if [Enable obscure combatant] is checked. Applies for non-GMs only."
- CHANGE: All options "Show [type] combatants initiative" is now "Hide [type] combatants initiative"
- CHANGE: All options "Show [type] combatants" is now "Hide [type] combatants"
- Moved module setttings to own form

## Version 1.2(2024-02-06)
- Added option "Enable round set","Enables custom defined round set for the combat tracker. Each round in the round set has its own phases."
- Reworked dropdowns, added dropdown items for selection based NPC disposition
- Reworked dropdowns to align when using "popped-out"(right-clicked) combat tracker

## Version 1.1(2024-02-01)
- Added option "Enable pan to token for non-GMs", "When checked, players can click a combatant in Combat Tracker and the canvas will pan to its token."
- Added option "Show combatant effect tooltips","When checked, combatants active effects in Combat Tracker will have a describing tooltip"
- Added option "Hide combatant effects for non-GMs","When checked, combatants active effects in Combat Tracker will only be showed for owned tokens."
- Added option "Hide token effects for non-GMs", "When checked, token active effects on the Canvas will only be showed for owned tokens."
- Added option "Enable change phase for non-GMs", "When checked, players can change phase in Combat Tracker for owned combatants"
- Added option "Default phase for players", "When adding a player token to combat, it will be added to this phase"
- Added option "Default phase for NPCs", "When adding a NPC token to combat, it will be added to this phase"
- Added command "Assign combatants to this phase"
- Added command "Encounter controls" for hiding/revealing/masking/unmasking/unset all/players/npcs
- FIX: Adding a token to canvas if no combat started gave error
- CHANGE: Moved Change phase command from context menu to dropdown
- CHANGE: Moved Change disposition command from context menu to dropdown
- CHANGE: Moved Toggle Token Invisibility command from context menu to dropdown
- CHANGE: Moved Duplicate Combatant/Remove all duplicants command from context menu to dropdown
- CHANGE: Minor visual changes for combatant list
- CHANGE: Option "Show combatant effect tooltips" now also add function for if not all effects can be showed, a summary icon with a full list as tooltip replaces all effect icons.
- CHANGE: An invisble(hidden) token will have it showed as an effect
## Version 1.0(2024-01-20)
- First release