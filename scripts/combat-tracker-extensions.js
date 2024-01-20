const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { libWrapper } from './shim.js';
import { SETTINGATTRIBUTE } from "./setting-constants.js"
import { settingsMenus, settingsRegistration, getModuleSetting } from "./settings-registration.js";
import { wrappedGetEntryContextOptions, wrappedOnHoverIn, wrappedOnHoverOut, wrappedOnToggleDefeatedStatus, _getCombatantsSharingToken } from "./duplicate-combatant.js";

Hooks.on('init', setup);

async function setup() {
  console.log(`${moduleTitle} | Initializing ${moduleTitle} module`);
  await settingsMenus(moduleId);
  await settingsRegistration(moduleId);

  if (getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID)) {
    console.log(`${moduleTitle} | Reversing initiative sort order, lowest goes first`);
    libWrapper.register(moduleId, 'Combat.prototype._sortCombatants', wrappedSortCombatants);
  }

//  if (getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD.ID)) {
//    // Remove initiative formula if replacing initiative roll with input field
//    CONFIG.Combat.initiative = {
//      formula: null,
//      decimals: 0
//    };
//  }

  if (getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT.ID)) {
    console.log(`${moduleTitle} | Added combatant context menu to have multiple combatants per token`);
    libWrapper.register(moduleId, 'CombatTracker.prototype._onToggleDefeatedStatus', wrappedOnToggleDefeatedStatus);
    libWrapper.register(moduleId, 'CombatTracker.prototype._getEntryContextOptions', wrappedGetEntryContextOptions);
    libWrapper.register(moduleId, 'Token.prototype._onHoverIn', wrappedOnHoverIn);
    libWrapper.register(moduleId, 'Token.prototype._onHoverOut', wrappedOnHoverOut);
  }
}

// Sort from low to high
function wrappedSortCombatants(wrapped, a, b) {
  const ia = Number.isNumeric(a.initiative) ? a.initiative : Infinity;
  const ib = Number.isNumeric(b.initiative) ? b.initiative : Infinity;
  const ci = ia - ib;
  if (ci !== 0)
    return ci;
  let [an, bn] = [a.token.name || "", b.token.name || ""];
  let cn = an.localeCompare(bn);
  if (cn !== 0)
    return cn;
  return a.tokenId - b.tokenId;
}


Hooks.on("updateToken", async (token, data, diff) => {
  //console.log(token,data);
  const OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT.ID);
  if (OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT) {
    // check if this token is in combat
    const combatTracker = game.combats.apps[0];
    const c = combatTracker.viewed.combatants.find(y => y.tokenId == token.id);

    if (c != null) {
      // check if moved
      let updateCombatTracker = false;
      if (data?.x ?? false)
        updateCombatTracker = true;
      if (data?.y ?? false)
        updateCombatTracker = true;
      // check iv vivibility changed
      if (data.hasOwnProperty('hidden'))
        updateCombatTracker = true;
      // check disposition
      if (data.hasOwnProperty('disposition'))
        updateCombatTracker = true;
      // check texture
      if (data.hasOwnProperty('texture')) // not working, still needs to refresh F5?
        updateCombatTracker = true;
      if (updateCombatTracker) {
        setTimeout(() => {
          combatTracker.render(true);
        }, 1000);

      }
    }
  }
});

Hooks.on("changeSidebarTab", async(app) => {
  //console.log(app);
  const OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING.ID);
  if (OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT || OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING) {
    if (app.id == 'combat') {
      // force render
      app.render();
    }
  }
});

Hooks.on("preCreateCombatant", async(combatant) => {
  const OPTION_COMBAT_TRACKER_ADD_COMBATANTS_HIDDEN = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_HIDDEN.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING.ID);
  const OPTION_COMBAT_TRACKER_ADD_COMBATANTS_NAME_MASKED = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_NAME_MASKED.ID);

  if (OPTION_COMBAT_TRACKER_ADD_COMBATANTS_HIDDEN) {
    if (combatant.isNPC) {
      await combatant.updateSource({hidden: true});
    }
  }
  if (OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING && OPTION_COMBAT_TRACKER_ADD_COMBATANTS_NAME_MASKED) {
    if (combatant.isNPC) {
      let flagUnknown = {sandbox: {maskname: true}};
      await combatant.updateSource({flags: flagUnknown});
    }
  }
});



Hooks.on('updateSetting', async (setting, value, diff) => {
  //console.log('updateSetting',setting);
  if (setting.key.startsWith(moduleId)) {
    const gamesetting = game.settings.settings.get(setting.key);
    //console.log(gamesetting);
    if (gamesetting.hasOwnProperty('requiresreload')) {
      if (gamesetting.requiresreload) {
        // reload for settings to take effect

        setTimeout(() => {
          location.reload();
        }, 2000);
      }
    } else {
      const combatTracker = game.combats.apps[0];

      setTimeout(() => {
        combatTracker.render(true);
      }, 2000);
    }
  }
});

Hooks.on('renderCombatTracker', async (combatTracker, html, combatData) => {
  //console.log('renderCombatTracker');
  //console.log("Hook On Render Combat Tracker | ", combatTracker, html, combatData);
  const OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING.ID);
  const OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS.ID);
  const OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD.ID);
  if (OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT || OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING || OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS || OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS || OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD) {
    const combatants = html.find('.combatant');
    for (const combatantElement of combatants) {
      const combatant = await game.combat.combatants.get(combatantElement.dataset.combatantId);
      //console.log(combatant);
      const token = await combatant.token;
      if ((OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS && game.user.isGM) || (OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS && !game.user.isGM)) {
        let dispositionColor = "#" + CONFIG.Canvas.dispositionColors.NEUTRAL.toString(16);
        // check disposition
        switch (token.disposition) {
          case CONST.TOKEN_DISPOSITIONS.FRIENDLY:
            dispositionColor = "#" + CONFIG.Canvas.dispositionColors.FRIENDLY.toString(16);
            break;
          case CONST.TOKEN_DISPOSITIONS.NEUTRAL:
            dispositionColor = "#" + CONFIG.Canvas.dispositionColors.NEUTRAL.toString(16);
            break;
          case CONST.TOKEN_DISPOSITIONS.HOSTILE:
            dispositionColor = "#" + CONFIG.Canvas.dispositionColors.HOSTILE.toString(16);
            break;
          case CONST.TOKEN_DISPOSITIONS.SECRET:
            dispositionColor = "#" + CONFIG.Canvas.dispositionColors.SECRET.toString(16);
            break;
          default:
            break;
        }
        combatantElement.style.background = dispositionColor + Math.round(255 * (30 / 100)).toString(16);
      }

      if (game.user.isGM) {
        if (OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD) {
          const initDiv = combatantElement.getElementsByClassName('token-initiative')[0];
          const min = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MIN.ID);
          const max = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MAX.ID);
          if (combatant.initiative == null) {
            // add text box next to roll
          } else {
            // put the value in a text box
            initDiv.innerHTML = ""; // clear out fixed value
            let inputInitiative = document.createElement("INPUT");
            inputInitiative.type = "number";
            inputInitiative.setAttribute('min', min);
            inputInitiative.setAttribute('max', max);
            inputInitiative.setAttribute('value', combatant.initiative);
            inputInitiative.addEventListener("change", async (e) => {
              const inputElement = e.target;
              const combatantId = inputElement.closest("[data-combatant-id]").dataset.combatantId;
              await combatTracker.viewed.setInitiative(combatantId, inputElement.value);
            });
            // add dummy click to stop paning
            inputInitiative.addEventListener("click", async (e) => {
              event.preventDefault();
              event.stopPropagation();
            });
            initDiv.appendChild(inputInitiative);
          }
        }
        if (OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING) {
          //console.log('add controls for masking/unmasking');
          const combatantControlsDiv = combatantElement.getElementsByClassName('combatant-controls')[0];
          //console.log(combatantControlsDiv);
          // get the last child
          const lastChild = combatantControlsDiv.lastElementChild;
          // create new and insert before
          let aMask = document.createElement("A");
          let isMasked = combatant.flags?.sandbox?.maskname ?? false;
          if (isMasked) {
            aMask.setAttribute('class', 'combat-tracker-extensions-combatant-control active');
          } else {
            aMask.setAttribute('class', 'combat-tracker-extensions-combatant-control');
          }
          aMask.setAttribute('data-control', 'toggleNameMask');
          aMask.setAttribute('data-tooltip', game.i18n.localize("COMBAT.ToggleNameMask"));
          let iMask = document.createElement("I");
          iMask.setAttribute('class', 'fas fa-mask');

          aMask.appendChild(iMask);
          // add toggle event
          aMask.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const btn = event.currentTarget;
            const li = btn.closest(".combatant");
            const combat = combatTracker.viewed;
            const c = combat.combatants.get(li.dataset.combatantId);
            let isMasked = combatant.flags?.sandbox?.maskname ?? false;
            let flagUnknown = {sandbox: {maskname: true}};
            if (isMasked) {
              flagUnknown.sandbox.maskname = false;
            }
            const otherCombatantsSharingToken = _getCombatantsSharingToken(c);
            for (const cb of otherCombatantsSharingToken) {
              await cb.update({flags: flagUnknown});
            }
          });

          let inserted = combatantControlsDiv.insertBefore(aMask, lastChild);
        }
      } else {
        // for non-GMs
        const OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_VISIBILITY = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_VISIBILITY.ID);
        const OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_DISPOSITION = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_DISPOSITION.ID);

        const initDiv = combatantElement.getElementsByClassName('token-initiative')[0];
        const nameDiv = combatantElement.getElementsByClassName('token-name')[0];

        if (initDiv) {
          const combatantLi = initDiv.parentNode;
          let hideInitiativeValue = false;
          let hideCombatantEntry = false;
          let hideCombatantName = false;

          if (OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING) {
            // check flags
            if (combatant.flags?.sandbox?.maskname ?? false) {
              hideCombatantName = true;
            }
          }

          if (OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT) {
            const OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_NPCS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_NPCS.ID);
            const OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_NON_NPCS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_NON_NPCS.ID);
            if (OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_DISPOSITION) {
              const OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_FRIENDLY = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_FRIENDLY.ID);
              const OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_NEUTRAL = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_NEUTRAL.ID);
              const OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_HOSTILE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_HOSTILE.ID);
              const OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_SECRET = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_SECRET.ID);
              const OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_FRIENDLY = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_FRIENDLY.ID);
              const OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_NEUTRAL = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_NEUTRAL.ID);
              const OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_HOSTILE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_HOSTILE.ID);
              const OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_SECRET = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_SECRET.ID);
              // check disposition
              switch (token.disposition) {
                case CONST.TOKEN_DISPOSITIONS.FRIENDLY:
                  hideInitiativeValue = !OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_FRIENDLY;
                  hideCombatantEntry = !OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_FRIENDLY;
                  break;
                case CONST.TOKEN_DISPOSITIONS.NEUTRAL:
                  hideInitiativeValue = !OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_NEUTRAL;
                  hideCombatantEntry = !OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_NEUTRAL;
                  break;
                case CONST.TOKEN_DISPOSITIONS.HOSTILE:
                  hideInitiativeValue = !OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_HOSTILE;
                  hideCombatantEntry = !OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_HOSTILE;
                  break;
                case CONST.TOKEN_DISPOSITIONS.SECRET:
                  hideInitiativeValue = !OPTION_COMBAT_TRACKER_SHOW_INITIATIVES_SECRET;
                  hideCombatantEntry = !OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_SECRET;
                  break;
                default:
                  break;
              }
            }
            
            if (combatant.isNPC && !OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_NPCS) {
              hideInitiativeValue = true;
              hideCombatantEntry = true;
              hideCombatantName = true;
            }
            if (!combatant.isNPC && !OPTION_COMBAT_TRACKER_SHOW_COMBATANTS_NON_NPCS) {
              hideInitiativeValue = true;
              hideCombatantEntry = true;
              hideCombatantName = true;
            }


            if (OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_VISIBILITY) {
              // check for visibility
              if (canvas.ready && (combatant.sceneId == canvas.scene.id)) {
                const canSeeToken = await token.object.visible;
                if (!canSeeToken) {
                  hideInitiativeValue = true;
                  hideCombatantEntry = true;
                }
              }
            }
          }



          // always check for ownership
          if (token.isOwner) {
            hideInitiativeValue = false;
            hideCombatantEntry = false;
            hideCombatantName = false;
          }
          if (OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING && hideCombatantName) {
            nameDiv.firstElementChild.innerText = game.i18n.localize("COMBAT.UnknownCombatant");
          }
          if (OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT) {
            if (hideInitiativeValue) {
              initDiv.remove();
            }
            if (hideCombatantEntry) {
              combatantLi.remove();
            }
          }
        }
      }
    }
  }

});
