const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { libWrapper } from './shim.js';
import { SETTINGATTRIBUTE } from "./setting-constants.js"
import { settingsMenus, settingsRegistration, getModuleSetting } from "./settings-registration.js";
import { wrappedSortCombatants, wrappedGetEntryContextOptions, wrappedOnHoverIn, wrappedOnHoverOut, wrappedOnToggleDefeatedStatus, _getCombatantsSharingToken } from "./fvttt_core_overrides.js";

Hooks.on('init', setup);

async function setup() {
  console.log(`${moduleTitle} | Initializing ${moduleTitle} module`);
  await settingsMenus(moduleId);
  await settingsRegistration(moduleId);
  if (getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID) || getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID)) {
    // check for valid defined phases
    console.log(`${moduleTitle} | Overriding default combatant sorting`);
    libWrapper.register(moduleId, 'Combat.prototype._sortCombatants', wrappedSortCombatants);
  }
  if (getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT.ID) || getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE.ID)) {
    console.log(`${moduleTitle} | Added combatant context menus`);
    libWrapper.register(moduleId, 'CombatTracker.prototype._onToggleDefeatedStatus', wrappedOnToggleDefeatedStatus);
    libWrapper.register(moduleId, 'CombatTracker.prototype._getEntryContextOptions', wrappedGetEntryContextOptions);
    libWrapper.register(moduleId, 'Token.prototype._onHoverIn', wrappedOnHoverIn);
    libWrapper.register(moduleId, 'Token.prototype._onHoverOut', wrappedOnHoverOut);
  }
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
        }, 2000);
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
  const OPTION_COMBAT_TRACKER_ENABLE_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID);
  if (OPTION_COMBAT_TRACKER_ADD_COMBATANTS_HIDDEN) {
    if (combatant.isNPC) {
      await combatant.updateSource({hidden: true});
    }
  }
  let flags;
  if (OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING && OPTION_COMBAT_TRACKER_ADD_COMBATANTS_NAME_MASKED) {
    if (combatant.isNPC) {
      flags = {combattrackerextensions: {maskname: true}};
    }
  }
  if (OPTION_COMBAT_TRACKER_ENABLE_PHASES) {
    let unsetPhaseValue = 9999;
    if (flags == null) {
      flags = {combattrackerextensions: {phase: unsetPhaseValue}};
    } else {
      flags.combattrackerextensions.phase = unsetPhaseValue;
    }
  }
  if (flags != null) {
    await combatant.updateSource({flags: flags});
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
  const OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_PLAYERS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_PLAYERS.ID);
  const OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_VISIBILITY_TOGGLE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_VISIBILITY_TOGGLE.ID);


  if (OPTION_COMBAT_TRACKER_ENABLE_VISIBILITY_TOGGLE || OPTION_COMBAT_TRACKER_ENABLE_PHASES || OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS || OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_PLAYERS || OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT || OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING || OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS || OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS || OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD) {
    let definedPhases = null;
    if (OPTION_COMBAT_TRACKER_ENABLE_PHASES) {
      const OPTION_COMBAT_TRACKER_DEFINED_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_DEFINED_PHASES.ID);
      if (OPTION_COMBAT_TRACKER_DEFINED_PHASES.length > 0)
        definedPhases = JSON.parse(OPTION_COMBAT_TRACKER_DEFINED_PHASES);
      if (definedPhases == null)
        definedPhases = {phases: []};
      // push an extra phase 'Unset'
      const phaseUnset = {name: game.i18n.localize("COMBAT.PhaseUnset"), icon: 'fa-question'};
      definedPhases.phases.push(phaseUnset);
    }
    const combatants = html.find('.combatant');
    const combatantOl = html.find('#combat-tracker')[0];

    let currentPhase = 0;
    for (const combatantElement of combatants) {
      const combatant = await game.combat.combatants.get(combatantElement.dataset.combatantId);
      const combatantPhase = combatant.flags?.combattrackerextensions?.phase ?? Infinity;
      if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && definedPhases != null) {
        for (let i = currentPhase; i < definedPhases.phases.length && i <= combatantPhase; i++) {
          currentPhase = combatantPhase + 1;
          let phaseLi = document.createElement('LI');
          phaseLi.setAttribute('class', 'combat-tracker-extensions-phase flexrow');
          let phaseDiv = document.createElement('DIV');
          phaseDiv.setAttribute('class', 'combat-tracker-extensions-phase');
          phaseDiv.setAttribute('data-phase', definedPhases.phases[i].name);
          let phaseTitle = document.createElement('H3');
          phaseTitle.innerHTML = `<i class="fas ${definedPhases.phases[i].icon}"></i> ${definedPhases.phases[i].name}`;
          phaseDiv.appendChild(phaseTitle);
          phaseLi.appendChild(phaseDiv);
          let inserted = combatantOl.insertBefore(phaseLi, combatantElement);
        }
      }
      //console.log(combatant);
      const token = await combatant.token;
      //console.log(token);
      if ((OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS && game.user.isGM) || (OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS && !game.user.isGM)) {
        // --------------------------------------
        // For both gms and non-gms if applicable
        // --------------------------------------
        
        combatantElement.classList.remove('combat-tracker-extensions-disposition-friendly');
        combatantElement.classList.remove('combat-tracker-extensions-disposition-neutral');
        combatantElement.classList.remove('combat-tracker-extensions-disposition-hostile');
        combatantElement.classList.remove('combat-tracker-extensions-disposition-secret');
        // check disposition
        switch (token?.disposition ?? '') {
          case CONST.TOKEN_DISPOSITIONS.FRIENDLY:            
            combatantElement.classList.add('combat-tracker-extensions-disposition-friendly');
            break;
          case CONST.TOKEN_DISPOSITIONS.NEUTRAL:            
            combatantElement.classList.add('combat-tracker-extensions-disposition-neutral');
            break;
          case CONST.TOKEN_DISPOSITIONS.HOSTILE:            
            combatantElement.classList.add('combat-tracker-extensions-disposition-hostile');
            break;
          case CONST.TOKEN_DISPOSITIONS.SECRET:            
            combatantElement.classList.add('combat-tracker-extensions-disposition-secret');
            break;
          default:            
            combatantElement.classList.add('combat-tracker-extensions-disposition-secret');
            break;
        }
        
      }
      if ((OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS && game.user.isGM) || (OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_PLAYERS && !game.user.isGM)) {
        // get the image from the token actor portrait
        // console.log(combatant);
        const actorImg = token.actor.img;
        // get the image element   token-image
        let initImg = combatantElement.getElementsByClassName('token-image')[0];
        if (initImg.src != actorImg) {
          // replace the image src attribute
          const newImg = document.createElement('IMG');
          newImg.src = actorImg;
          initImg.replaceWith(newImg);

        }
      }
      if (game.user.isGM) {
        // ----------------------------
        // FOR GMSs
        // ----------------------------
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
          let isMasked = combatant.flags?.combattrackerextensions?.maskname ?? false;
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
            let isMasked = combatant.flags?.combattrackerextensions?.maskname ?? false;
            let flagUnknown = {combattrackerextensions: {maskname: true}};
            if (isMasked) {
              flagUnknown.combattrackerextensions.maskname = false;
            }
            const otherCombatantsSharingToken = _getCombatantsSharingToken(c);
            for (const cb of otherCombatantsSharingToken) {
              await cb.update({flags: flagUnknown});
            }
          });
          let inserted = combatantControlsDiv.insertBefore(aMask, lastChild);
        }

        if (OPTION_COMBAT_TRACKER_ENABLE_VISIBILITY_TOGGLE) {
          //console.log('add controls for visibility toggle');
          const combatantControlsDiv = combatantElement.getElementsByClassName('combatant-controls')[0];
          //console.log(combatantControlsDiv);
          // get the last child
          const lastChild = combatantControlsDiv.lastElementChild;
          // create new and insert before
          let aTokenVisibility = document.createElement("A");
          let isTokenVisible = token.hidden;
          if (isTokenVisible) {
            aTokenVisibility.setAttribute('class', 'combat-tracker-extensions-combatant-control active');
          } else {
            aTokenVisibility.setAttribute('class', 'combat-tracker-extensions-combatant-control');
          }
          aTokenVisibility.setAttribute('data-control', 'toggleTokenVisibility');
          aTokenVisibility.setAttribute('data-tooltip', game.i18n.localize("COMBAT.ToggleTokenVisibility"));
          let iMask = document.createElement("I");
          iMask.setAttribute('class', 'fas fa-user-slash');
          aTokenVisibility.appendChild(iMask);
          // add toggle event
          aTokenVisibility.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const btn = event.currentTarget;
            const li = btn.closest(".combatant");
            const combat = combatTracker.viewed;
            const c = combat.combatants.get(li.dataset.combatantId);
            const token = await c.token;
            let isTokenVisible = token.hidden;
            await token.update({hidden:!isTokenVisible});
          });
          let inserted = combatantControlsDiv.insertBefore(aTokenVisibility, lastChild);
        }
      } else {
        // --------------------------------
        // for non-GMs
        // --------------------------------
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
            if (combatant.flags?.combattrackerextensions?.maskname ?? false) {
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

    // Add final phases no already added
    if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && definedPhases != null) {
      for (let i = currentPhase; i < definedPhases.phases.length; i++) {
        let phaseLi = document.createElement('LI');
        phaseLi.setAttribute('class', 'combat-tracker-extensions-phase flexrow');
        let phaseDiv = document.createElement('DIV');
        phaseDiv.setAttribute('class', 'combat-tracker-extensions-phase');
        let phaseIcon = document.createElement('I');
        phaseIcon.setAttribute('class', 'fas ' + definedPhases.phases[i].icon);
        let phaseTitle = document.createElement('H3');
        phaseTitle.appendChild(phaseIcon);
        phaseTitle.innerHTML = `<i class="fas ${definedPhases.phases[i].icon}"></i> ${definedPhases.phases[i].name}`;
        phaseDiv.appendChild(phaseTitle);
        phaseLi.appendChild(phaseDiv);
        let inserted = combatantOl.appendChild(phaseLi);
      }
    }
  }
});
