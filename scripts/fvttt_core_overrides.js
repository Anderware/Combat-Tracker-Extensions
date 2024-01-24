import { getModuleSetting } from "./settings-registration.js";
import { SETTINGATTRIBUTE } from "./setting-constants.js"
const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';


// Custom sorting based on settings
export function wrappedSortCombatants(wrapped, a, b) {
  const OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID);
  let unsetInitiativeValue=-Infinity;
  if(OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE){
    unsetInitiativeValue=Infinity;
  }
    
  const initiativeA = Number.isNumeric(a.initiative) ? a.initiative : unsetInitiativeValue;
  const initiativeB = Number.isNumeric(b.initiative) ? b.initiative : unsetInitiativeValue;
  
  if(OPTION_COMBAT_TRACKER_ENABLE_PHASES){
    const phaseA = Number.isNumeric(a.flags.combattrackerextensions?.phase) ? a.flags.combattrackerextensions?.phase : -Infinity;
    const phaseB = Number.isNumeric(b.flags.combattrackerextensions?.phase) ? b.flags.combattrackerextensions?.phase : -Infinity;
    if(OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE){
      return phaseA - phaseB || initiativeA - initiativeB || a.token.name.localeCompare(b.token.name) || a.tokenId - b.tokenId;
    } else {
      return phaseA - phaseB || initiativeB - initiativeA || a.token.name.localeCompare(b.token.name) || a.tokenId - b.tokenId;
    }    
  } else{
    if(OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE){
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

// CombatTracker - Add a context menu options
export function wrappedGetEntryContextOptions() {
  let menuItems = [
    {
      name: "COMBAT.CombatantUpdate",
      icon: '<i class="fas fa-edit"></i>',
      group:`foundry-standard`,
      callback: this._onConfigureCombatant.bind(this)
    },
    {
      name: "COMBAT.CombatantClear",
      icon: '<i class="fas fa-undo"></i>',
      group:`foundry-standard`,
      condition: li => {
        const combatant = this.viewed.combatants.get(li.data("combatant-id"));
        return Number.isNumeric(combatant?.initiative);
      },
      callback: li => {
        const combatant = this.viewed.combatants.get(li.data("combatant-id"));
        if (combatant)
          return combatant.update({initiative: null});
      }
    },
    {
      name: "COMBAT.CombatantReroll",
      icon: '<i class="fas fa-dice-d20"></i>',
      group:`foundry-standard`,
      callback: li => {
        const combatant = this.viewed.combatants.get(li.data("combatant-id"));
        if (combatant)
          return this.viewed.rollInitiative([combatant.id]);
      }
    },
    {
      name: "COMBAT.CombatantRemove",
      icon: '<i class="fas fa-trash"></i>',
      group:`foundry-standard`,
      callback: li => {
        const combatant = this.viewed.combatants.get(li.data("combatant-id"));
        return combatant.delete();
      }
    }

  ];

  const OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT.ID);
  if (OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT && game.user.isGM) {
    let menuItemAddDuplicate = {
      name: "COMBAT.DuplicateCombatant",
      icon: '<i class="far fa-copy"></i>',
      group:`${moduleId}-duplicate`,
      callback: async (li) => {
        const combatant = this.viewed.combatants.get(li.data("combatant-id"));
        this.viewed.createEmbeddedDocuments("Combatant", [combatant]);
      }
    };
    menuItems.push(menuItemAddDuplicate);

    let menuItemRemoveAllDuplicates = {
      name: "COMBAT.RemoveAllDuplicates",
      icon: '<i class="fas fa-trash"></i>',
      group:`${moduleId}-duplicate`,
      callback: li => {
        const combatant = this.viewed.combatants.get(li.data("combatant-id"));
        _getCombatantsSharingToken(combatant)
                .forEach(c => c.delete());
        return true;
      }
    };
    menuItems.push(menuItemRemoveAllDuplicates);
  }
  const OPTION_COMBAT_TRACKER_ENABLE_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID);
  if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && game.user.isGM) {
    if (OPTION_COMBAT_TRACKER_ENABLE_PHASES) {
      const OPTION_COMBAT_TRACKER_DEFINED_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_DEFINED_PHASES.ID);

      if (OPTION_COMBAT_TRACKER_DEFINED_PHASES.length > 0) {
        let definedPhases = JSON.parse(OPTION_COMBAT_TRACKER_DEFINED_PHASES);
        
        // push an extra phase 'Unset'
        const phaseUnset = {name: game.i18n.localize("COMBAT.PhaseUnset"), icon: 'fa-question'};
        definedPhases.phases.push(phaseUnset);
        for (let i = 0; i < definedPhases.phases.length; i++) {
          let phasemenuItem = {
            name: game.i18n.format("COMBAT.ChangePhase",{phasename:definedPhases.phases[i].name}),
            icon: `<i class="fas ${definedPhases.phases[i].icon}"></i>`,
            group:`${moduleId}-change-phase`,
            callback: li => {
              const combatant = this.viewed.combatants.get(li.data("combatant-id"));
              const flags = {combattrackerextensions: {phase: i}};
              combatant.update({flags:flags});
            }
          };
          menuItems.push(phasemenuItem);
        }
      }
    }
  }

  const OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE.ID);
  if (OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE && game.user.isGM) {
    let menuItemFriendly =
            {
              name: "COMBAT.ChangeDispositionToFriendly",
              icon: '<i class="fas fa-face-smile"></i>',
              group:`${moduleId}-change-disposition`,
              callback: li => {
                const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                const token = combatant.token;
                token.update({disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY});
              }
            };
    menuItems.push(menuItemFriendly);

    let menuItemNeutral =
            {
              name: "COMBAT.ChangeDispositionToNeutral",
              icon: '<i class="fas fa-face-meh"></i>',
              group:`${moduleId}-change-disposition`,
              callback: li => {
                const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                const token = combatant.token;
                token.update({disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL});
              }
            };
    menuItems.push(menuItemNeutral);

    let menuItemHostile =
            {
              name: "COMBAT.ChangeDispositionToHostile",
              icon: '<i class="fas fa-face-angry"></i>',
              group:`${moduleId}-change-disposition`,
              callback: li => {
                const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                const token = combatant.token;
                token.update({disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE});
              }
            };
    menuItems.push(menuItemHostile);

    // only add SECRET for Foundry 11  <i class="fa-solid fa-face-hand-over-mouth"></i>
    if (isNewerVersion(game.version, 11)) {
      let menuItemSecret =
              {
                name: "COMBAT.ChangeDispositionToSecret",
                icon: '<i class="fas fa-face-hand-over-mouth"></i>',
                group:`${moduleId}-change-disposition`,
                callback: li => {
                  const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                  const token = combatant.token;
                  token.update({disposition: CONST.TOKEN_DISPOSITIONS.SECRET});
                }
              };
      menuItems.push(menuItemSecret);
    }
  }


  return menuItems;
}
