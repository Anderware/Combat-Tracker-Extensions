import { getModuleSetting } from "./settings-registration.js";
import { SETTINGATTRIBUTE } from "./setting-constants.js"
        const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';


// Custom sorting based on settings
export function wrappedSortCombatants(wrapped, a, b) {
  //console.log(`wrappedSortCombatants | sorting ${a.token.name}, ${b.token.name}`)
  const OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID);
  let unsetInitiativeValue = -Infinity;
  if (OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE) {
    unsetInitiativeValue = Infinity;
  }

  const initiativeA = Number.isNumeric(a.initiative) ? a.initiative : unsetInitiativeValue;
  const initiativeB = Number.isNumeric(b.initiative) ? b.initiative : unsetInitiativeValue;

  if (OPTION_COMBAT_TRACKER_ENABLE_PHASES) {
    const phaseA = Number.isNumeric(a.flags.combattrackerextensions?.phase) ? a.flags.combattrackerextensions?.phase : -Infinity;
    const phaseB = Number.isNumeric(b.flags.combattrackerextensions?.phase) ? b.flags.combattrackerextensions?.phase : -Infinity;
    if (OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE) {
      return phaseA - phaseB || initiativeA - initiativeB || a.token.name.localeCompare(b.token.name) || a.tokenId - b.tokenId;
    } else {
      return phaseA - phaseB || initiativeB - initiativeA || a.token.name.localeCompare(b.token.name) || a.tokenId - b.tokenId;
    }
  } else {
    if (OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE) {
      return initiativeA - initiativeB || a.token.name.localeCompare(b.token.name) || a.tokenId - b.tokenId;
    } else {
      return initiativeB - initiativeA || a.token.name.localeCompare(b.token.name) || a.tokenId - b.tokenId;
    }
  }
}


// CombatTracker - Sync defeated status among combatants that belong to the same token
export async function wrappedOnToggleDefeatedStatus(wrapped, combatant) {
  let isDefeated = !combatant.defeated;
  const otherCombatantsSharingToken = _getCombatantsSharingToken(combatant);
  wrapped(combatant);
  for (const cb of otherCombatantsSharingToken) {
    await cb.update({defeated: isDefeated});
  }
}

// Token - Highlight connected combatants when hovered
export function wrappedOnHoverIn(wrapped, event, options) {
  wrapped(event, options);
  const combatant = this.combatant;
  if (combatant) {
    const tracker = document.getElementById("combat-tracker");
    _getCombatantsSharingToken(combatant)
            .forEach(cb => {
              const li = tracker.querySelector(`.combatant[data-combatant-id="${cb.id}"]`);
              if (li)
                li.classList.add("hover");
            });
  }
}

// Token - Remove highlight of connected combatants when not hovered anymore
export function wrappedOnHoverOut(wrapped, event) {
  wrapped(event);

  const combatant = this.combatant;
  if (combatant) {
    const tracker = document.getElementById("combat-tracker");
    _getCombatantsSharingToken(combatant)
            .forEach(cb => {
              const li = tracker.querySelector(`.combatant[data-combatant-id="${cb.id}"]`);
              if (li)
                li.classList.remove("hover");
            });
  }
}

export function _getCombatantsSharingToken(combatant) {
  const combatantTokenIds = combatant.actor.getActiveTokens(false, true).map(t => t.id);
  return combatant.parent.combatants
          .filter(cb => combatantTokenIds.includes(cb.tokenId));
}




export function wrappedDisplayScrollingStatus(wrapped,enabled) {  
  const OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS.ID);
    if (isNewerVersion(game.version, 11)) {
      // v11
      if (!(this.statuses.size || this.changes.length))
        return;
      const actor = this.target;
      const tokens = actor.getActiveTokens(true);
      const text = `${enabled ? "+" : "-"}(${this.name})`;
      for (let t of tokens) {
        if (!t.visible || !t.renderable)
          continue;
        if((OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS && !game.user.isGM) && !t.isOwner)
          continue;
        canvas.interface.createScrollingText(t.center, text, {
          anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
          direction: enabled ? CONST.TEXT_ANCHOR_POINTS.TOP : CONST.TEXT_ANCHOR_POINTS.BOTTOM,
          distance: (2 * t.h),
          fontSize: 28,
          stroke: 0x000000,
          strokeThickness: 4,
          jitter: 0.25
        });
      }
    } else {
      // v 10
      if (!(this.flags.core?.statusId || this.changes.length))
        return;
      const actor = this.parent;
      const tokens = actor.isToken ? [actor.token?.object] : actor.getActiveTokens(true);
      const label = `${enabled ? "+" : "-"}(${this.label})`;
      for (let t of tokens) {
        if (!t.visible || !t.renderable)
          continue;
        if((OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS && !game.user.isGM) && !t.isOwner)
          continue;
        canvas.interface.createScrollingText(t.center, label, {
          anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
          direction: enabled ? CONST.TEXT_ANCHOR_POINTS.TOP : CONST.TEXT_ANCHOR_POINTS.BOTTOM,
          distance: (2 * t.h),
          fontSize: 28,
          stroke: 0x000000,
          strokeThickness: 4,
          jitter: 0.25
        });
      }
    }
  
}