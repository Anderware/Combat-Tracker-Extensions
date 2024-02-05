const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { libWrapper } from './shim.js';
import { SETTINGATTRIBUTE } from "./setting-constants.js"
import { settingsMenus, settingsRegistration, getModuleSetting } from "./settings-registration.js";
import { wrappedSortCombatants, wrappedOnHoverIn, wrappedOnHoverOut, wrappedOnToggleDefeatedStatus, _getCombatantsSharingToken, wrappedDisplayScrollingStatus } from "./fvttt_core_overrides.js";
import { DropDownMenu } from "./dropdownmenu.js";

Hooks.on('init', _onInit);
Hooks.on("ready", _onReady);

async function _onInit() {
  console.log(`${moduleTitle} | Initializing ${moduleTitle} module`);
  await settingsMenus(moduleId);
  await settingsRegistration(moduleId);
  console.log(`${moduleTitle} | Settings up overrides`);
  if (getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID) || getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID)) {
    // check for valid defined phases
    console.log(`${moduleTitle} | Overriding default combatant sorting`);
    libWrapper.register(moduleId, 'Combat.prototype._sortCombatants', wrappedSortCombatants);
  }
  if (getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT.ID)) {
    libWrapper.register(moduleId, 'CombatTracker.prototype._onToggleDefeatedStatus', wrappedOnToggleDefeatedStatus);
    libWrapper.register(moduleId, 'Token.prototype._onHoverIn', wrappedOnHoverIn);
    libWrapper.register(moduleId, 'Token.prototype._onHoverOut', wrappedOnHoverOut);
  }


}

async function _onReady() {
  // isGM is not available on init
  if (!game.user.isGM && getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS.ID)) {
    libWrapper.register(moduleId, 'ActiveEffect.prototype._displayScrollingStatus', wrappedDisplayScrollingStatus);
  }
  DropDownMenu.eventListeners();
  console.log(`${moduleTitle} | Module ${moduleTitle} ready`);
}



Hooks.on("updateToken", async (token, data, diff) => {
  //console.log(token,data);
  const OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT.ID);
  if (OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT) {
    // check if this token is in combat
    const combatTracker = game.combats.apps[0];
    if (combatTracker.viewed != null) {
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
    const OPTION_COMBAT_TRACKER_DEFAULT_PHASE_PLAYERS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_DEFAULT_PHASE_PLAYERS.ID);
    const OPTION_COMBAT_TRACKER_DEFAULT_PHASE_NPCS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_DEFAULT_PHASE_NPCS.ID);

    let defaultPhaseValue = OPTION_COMBAT_TRACKER_DEFAULT_PHASE_PLAYERS;
    if (combatant.isNPC) {
      defaultPhaseValue = OPTION_COMBAT_TRACKER_DEFAULT_PHASE_NPCS;
    }
    if (flags == null) {
      flags = {combattrackerextensions: {phase: defaultPhaseValue}};
    } else {
      flags.combattrackerextensions.phase = defaultPhaseValue;
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
  const OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_PAN_TO_TOKEN = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_PAN_TO_TOKEN.ID);
  const OPTION_COMBAT_TRACKER_SHOW_TOKEN_EFFECT_TOOLTIPS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_TOKEN_EFFECT_TOOLTIPS.ID);
  const OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_ROUNDSET = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_ROUNDSET.ID);

  if (OPTION_COMBAT_TRACKER_ENABLE_ROUNDSET || OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT || OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS || OPTION_COMBAT_TRACKER_SHOW_TOKEN_EFFECT_TOOLTIPS || OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_PAN_TO_TOKEN || OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE || OPTION_COMBAT_TRACKER_ENABLE_VISIBILITY_TOGGLE || OPTION_COMBAT_TRACKER_ENABLE_PHASES || OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS || OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_PLAYERS || OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT || OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING || OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS || OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS || OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD) {
    const combatTrackerId=html[0].id;
    const isPoppedOut = (combatTrackerId=='combat-popout');
    let downVerticalAdjustment = 0;
    let upVerticalAdjustment = 0;
    let leftHorizontalAdjustment=0;
    let rightHorizontalAdjustment=0;
    let trackerRect=html[0].getBoundingClientRect();
    let windowElementSelector=null;
    if(isPoppedOut){      
      windowElementSelector='#combat-popout';
      
    }
    let dropDownMenuOptions={
      downVerticalAdjustment:downVerticalAdjustment,
      upVerticalAdjustment:upVerticalAdjustment,
      leftHorizontalAdjustment:leftHorizontalAdjustment,
      rightHorizontalAdjustment:rightHorizontalAdjustment,
      windowElementSelector:windowElementSelector
    };
    
    if (OPTION_COMBAT_TRACKER_ENABLE_ROUNDSET) {
      const OPTION_COMBAT_TRACKER_DEFINED_ROUNDSET = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_DEFINED_ROUNDSET.ID);
      if (OPTION_COMBAT_TRACKER_DEFINED_ROUNDSET.length > 0) {
        let definedRoundSet = JSON.parse(OPTION_COMBAT_TRACKER_DEFINED_ROUNDSET);
        if (definedRoundSet != null) {
          // get current round
          const  currentRound = combatTracker?.viewed?.round ?? 0;
          if (currentRound > 0) {
            const roundSetCount = definedRoundSet.rounds.length;
            let adjustedRound = Math.ceil(currentRound / roundSetCount);  // 

            let currentRoundSetRound = (currentRound % roundSetCount);                 // remainder
            if (currentRoundSetRound == 0)
              currentRoundSetRound = roundSetCount;
            const roundName = definedRoundSet.rounds[currentRoundSetRound - 1].name;
            //const roundIcon = `<i class="fas ${definedRoundSet.rounds[currentRoundSetRound - 1].icon}"></i>`;
            const encounterTitle = html.find('.encounter-title')[0];
            // replace it 
            encounterTitle.innerHTML = `${roundName}`;
            // build tooltip
            let roundTooltip=`<div class="combat-tracker-extensions-roundset-current-round-set">Round Set ${adjustedRound}</div><ul class="combat-tracker-extensions-roundset-tooltip">`;
            for (var i = 0; i < definedRoundSet.rounds.length; i++) {
              let currentRoundMarker=``;
              if(i == currentRoundSetRound - 1){
                currentRoundMarker=`<i class="fas fa-right-long"></i>`;
              } 
              roundTooltip +=`<li><span class="combat-tracker-extensions-roundset-current-turn-marker">${currentRoundMarker}</span><i class="fas ${definedRoundSet.rounds[i].icon}"></i> ${definedRoundSet.rounds[i].name}</li>`;
            }
            roundTooltip +=`</ul>`;
            roundTooltip +=`<div class="combat-tracker-extensions-roundset-current-round">Foundry Round ${currentRound}</div>`;
            encounterTitle.setAttribute('data-tooltip',roundTooltip);
          }
        }
      }
    }

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
      //console.log(combatant);
      const token = await combatant.token;

      //console.log(token);
      const combatantPhase = combatant.flags?.combattrackerextensions?.phase ?? 999;
      //console.log(token.name, combatantPhase);
      if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && definedPhases != null) {
        for (let i = currentPhase; i < definedPhases.phases.length && i <= combatantPhase; i++) {
          let phaseLi = document.createElement('LI');
          if (currentPhase == 0) {
            phaseLi.setAttribute('class', 'combat-tracker-extensions-phase combat-tracker-extensions-phase-first flexrow');
          } else if (currentPhase < combatantPhase) {
            phaseLi.setAttribute('class', 'combat-tracker-extensions-phase combat-tracker-extensions-phase-before flexrow');
          } else if (currentPhase == combatantPhase) {
            phaseLi.setAttribute('class', 'combat-tracker-extensions-phase combat-tracker-extensions-phase-same flexrow');
          } else {
            phaseLi.setAttribute('class', 'combat-tracker-extensions-phase combat-tracker-extensions-phase-after flexrow');
          }
          let phaseDiv = document.createElement('DIV');
          phaseDiv.setAttribute('class', 'combat-tracker-extensions-phase');
          phaseDiv.setAttribute('data-phase', definedPhases.phases[i].name);
          let phaseTitle = document.createElement('H3');
          phaseTitle.setAttribute('class', 'combat-tracker-extensions-menu-phase-name');
          phaseTitle.innerHTML = `<i class="fas ${definedPhases.phases[i].icon}"></i> ${definedPhases.phases[i].name}`;
          phaseDiv.appendChild(phaseTitle);
          let menuItems = null;
          if (game.user.isGM) {
            let aCallGroup = document.createElement('A');
            menuItems = createAssignPhase(aCallGroup, combatTracker, i);
            phaseTitle.appendChild(aCallGroup);
          }
          phaseLi.appendChild(phaseDiv);
          let inserted = combatantOl.insertBefore(phaseLi, combatantElement);
          if (menuItems != null) {
            new DropDownMenu(phaseLi, `#combat-tracker-extensions-menu-phase-${i}`, menuItems,dropDownMenuOptions);
          }
          currentPhase = combatantPhase + 1;
        }
      }

      if ((OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS && game.user.isGM) || (OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS && !game.user.isGM)) {
        // --------------------------------------
        // For both gms and non-gms if applicable
        // --------------------------------------
        combatantElement.classList.remove('combat-tracker-extensions-disposition-friendly');
        combatantElement.classList.remove('combat-tracker-extensions-disposition-neutral');
        combatantElement.classList.remove('combat-tracker-extensions-disposition-hostile');
        combatantElement.classList.remove('combat-tracker-extensions-disposition-secret');
        combatantElement.classList.remove('combat-tracker-extensions-disposition-party');
        if (!combatant.isNPC) {
          combatantElement.classList.add('combat-tracker-extensions-disposition-party');
        } else {
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
      }
      if ((OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS && game.user.isGM) || (OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_PLAYERS && !game.user.isGM)) {
        // get the image from the token actor portrait
        // console.log(combatant);
        const actorImg = token.actor.img;
        // get the image element   token-image
        let initImg = combatantElement.getElementsByClassName('token-image')[0];
        if (initImg.src != actorImg) {
          // get the current classes
          const currentClassName = initImg.className;
          // replace the image src attribute
          const newImg = document.createElement('IMG');
          newImg.className = currentClassName;
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
      }

      let tokenEffects = combatantElement.getElementsByClassName('token-effects')[0];
      if (OPTION_COMBAT_TRACKER_SHOW_TOKEN_EFFECT_TOOLTIPS || (!game.user.isGM && OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS && !token.isOwner)) {
        // delete all default img for token effects               
        tokenEffects.innerHTML = '';
      }
      if (OPTION_COMBAT_TRACKER_SHOW_TOKEN_EFFECT_TOOLTIPS && (game.user.isGM || token.isOwner && OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS || !OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS)) {
        // add new ones for all appiledeffects
        const combatantControlsDiv = combatantElement.getElementsByClassName('combatant-controls')[0];
        //console.log(token.name,combatantControlsDiv.childElementCount)
        const controlCount = combatantControlsDiv.childElementCount;
        // assemble effects
        let effects = [];

        let addEffect = function (effects, effectName, effectIcon) {
          const result = effects.filter(y => (y.name == effectName && y.icon == effectIcon));
          if (result.length == 0) {
            effects.push({name: effectName, icon: effectIcon});
          }
        };
        let nameProperty = "label"; // foundry 10 uses "label"
        if (isNewerVersion(game.version, 11)) {
          nameProperty = "name"; // foundry 11 uses "name"
        }
        // check if token is invisible and add that as an effect
        if (token.hidden) {
          //effects.add({name:game.i18n.localize("EFFECT.StatusInvisible"),icon:"icons/svg/invisible.svg"});
          addEffect(effects, game.i18n.localize("EFFECT.StatusInvisible"), "icons/svg/invisible.svg");
        }

        if (combatant.token) {
          for (const effect of combatant.token.effects) {
            //effects.add({name:effect.label,icon:effect.icon});
            addEffect(effects, effect[nameProperty], effect.icon);
          }
        }
        if (combatant.token.overlayEffect) {
          //effects.add({name:"Overlay",icon:combatant.token.overlayEffect});
          addEffect(effects, "Overlay", combatant.token.overlayEffect);
        }
        if (combatant.actor) {
          for (const effect of combatant.actor.temporaryEffects) {
            // ignore "EFFECT.StatusDead"
            if (effect.name != game.i18n.localize("EFFECT.StatusDead")) {

              addEffect(effects, effect[nameProperty], effect.icon);
            }
          }
        }
        //console.log(token.name,effects);      
        const effectCount = effects.length;
        let maxIcons = 10;
        if (game.user.isGM) {
          maxIcons = 10;
        } else {
          maxIcons = 11;
        }
        let appliedEffectsTooltip = '';
        for (var i = 0; i < effectCount; i++) {
          appliedEffectsTooltip += `<div class="combat-tracker-extensions-appliedeffect-tooltip"><img class="combat-tracker-extensions-appliedeffect-icon" src="${effects[i].icon}"><span class="combat-tracker-extensions-appliedeffect-name">${effects[i].name}</span></div>`;
          if (controlCount + effectCount <= maxIcons) {
            let imgEffect = document.createElement('img');
            imgEffect.setAttribute('class', 'token-effect');
            imgEffect.setAttribute('data-tooltip', effects[i].name);
            imgEffect.setAttribute('src', effects[i].icon);
            tokenEffects.appendChild(imgEffect);
          }
        }

        if (appliedEffectsTooltip.length > 0 && (controlCount + effectCount > maxIcons)) {
          // too many effects, wont fit, add a summary icon
          //console.log(appliedEffectsTooltip)
          const lastChild = combatantControlsDiv.lastElementChild;
          let aActiveEffects = document.createElement("A");
          aActiveEffects.setAttribute('class', 'combat-tracker-extensions-combatant-control active');
          aActiveEffects.setAttribute('data-tooltip', appliedEffectsTooltip);
          let iActiveEffects = document.createElement("I");
          iActiveEffects.setAttribute('class', 'fas fa-circle-info');
          aActiveEffects.appendChild(iActiveEffects);
          let inserted = combatantControlsDiv.insertBefore(aActiveEffects, lastChild);
        }
      }

      if (!game.user.isGM) {
        // --------------------------------
        // for non-GMs
        // --------------------------------
        const OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_VISIBILITY = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_VISIBILITY.ID);
        const OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_DISPOSITION = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_DISPOSITION.ID);
        const initDiv = combatantElement.getElementsByClassName('token-initiative')[0];
        const nameDiv = combatantElement.getElementsByClassName('token-name')[0];
        if (initDiv) {
          const combatantLi = initDiv.parentNode;
          if (OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_PAN_TO_TOKEN) {
            combatantLi.addEventListener("click", async (event) => {
              event.preventDefault();
              const li = event.currentTarget;
              const combatant = combatTracker.viewed.combatants.get(li.dataset.combatantId);
              const token = combatant.token;
              // pan to Token object
              if (token?.object) {
                return canvas.animatePan(token.object.center);
              }
            });
          }
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
      // ------------------------
      // for all add cte commands
      // build menu
      let menuItems = [];
      let menuItem;
      // -------------------------
      // CHANGE PHASES
      // -------------------------
      const OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_CHANGE_PHASE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_CHANGE_PHASE.ID);
      // change phase if any both for gm and players
      if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && definedPhases != null && (game.user.isGM || OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_CHANGE_PHASE && token.isOwner)) {
        let combatantPhase = combatant.flags?.combattrackerextensions?.phase ?? 999;
        if (combatantPhase == 999 || combatantPhase == -1) {
          combatantPhase = definedPhases.phases.length - 1;
        }
        for (let i = 0; i < definedPhases.phases.length; i++) {
          const cid = combatant.id;
          let phasemenuItem = {
            name: game.i18n.format("COMBAT.ChangePhase", {phasename: definedPhases.phases[i].name}),
            icon: `<i class="fas ${definedPhases.phases[i].icon}"></i>`,
            condition: combatantPhase != i,
            callback: a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const flags = {combattrackerextensions: {phase: i}};
              combatant.update({flags: flags});
            }
          };
          menuItems.push(phasemenuItem);
        }

      }
      // TOKEN INVISIBILITY
      if (OPTION_COMBAT_TRACKER_ENABLE_VISIBILITY_TOGGLE && game.user.isGM) {
        let isTokenInVisible = token.hidden;
        let invisibleIcon;
        let initImg = combatantElement.getElementsByClassName('token-image')[0];
        if (isTokenInVisible) {
          invisibleIcon = 'far fa-user';
        } else {
          invisibleIcon = 'fas fa-user';
        }
        menuItems.push({separator: true});
        menuItem = {
          name: "COMBAT.ToggleTokenVisibility",
          icon: `<i class="${invisibleIcon}"></i>`,

          callback: a => {
            const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
            const token = combatant.token;
            token.update({hidden: !isTokenInVisible});
          }
        };
        menuItems.push(menuItem);

      }

      // -----------------
      // CHANGE DISPOSTION
      // -----------------
      if (OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE && game.user.isGM) {
        const tokenDisposition = token.disposition;
        menuItems.push({separator: true});
        let menuItemsDisposition = [
          {
            name: "COMBAT.ChangeDispositionToFriendly",
            icon: '<i class="fas fa-face-smile"></i>',
            condition: tokenDisposition != CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            callback: a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const token = combatant.token;
              token.update({disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY});
            }
          },
          {
            name: "COMBAT.ChangeDispositionToNeutral",
            icon: '<i class="fas fa-face-meh"></i>',
            condition: tokenDisposition != CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            callback: a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const token = combatant.token;
              token.update({disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL});
            }
          },
          {
            name: "COMBAT.ChangeDispositionToHostile",
            icon: '<i class="fas fa-face-angry"></i>',
            condition: tokenDisposition != CONST.TOKEN_DISPOSITIONS.HOSTILE,
            callback: a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const token = combatant.token;
              token.update({disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE});
            }
          },
          {
            name: "COMBAT.ChangeDispositionToSecret",
            icon: '<i class="fas fa-face-hand-over-mouth"></i>',
            condition: isNewerVersion(game.version, 11) && tokenDisposition != CONST.TOKEN_DISPOSITIONS.SECRET,
            callback: a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const token = combatant.token;
              token.update({disposition: CONST.TOKEN_DISPOSITIONS.SECRET});
            }
          }

        ];
        menuItems = menuItems.concat(menuItemsDisposition);

      }
      if (OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT && game.user.isGM) {
        menuItems.push({separator: true});
        let menuItemAddDuplicate = {
          name: "COMBAT.DuplicateCombatant",
          icon: '<i class="far fa-copy"></i>',
          callback: a => {
            const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
            combatTracker.viewed.createEmbeddedDocuments("Combatant", [combatant]);
          }
        };
        menuItems.push(menuItemAddDuplicate);

        let menuItemRemoveAllDuplicates = {
          name: "COMBAT.RemoveAllDuplicates",
          icon: '<i class="fas fa-trash"></i>',
          callback: a => {
            const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
            _getCombatantsSharingToken(combatant)
                    .forEach(c => c.delete());
            return true;
          }
        };
        menuItems.push(menuItemRemoveAllDuplicates);
      }

      // -----------------------------------------------------------------------
      // menu completed
      // -----------------------------------------------------------------------
      // if any menuitems have been added, add the dropdown
      if (menuItems.length > 0) {
//        menuItems.push({separator: true});
//        // add final cancel        
//        menuItem = // cancel with empty function
//                {name: "COMBAT.ChangePhaseCancel",
//                  icon: '<i class="fas fa-xmark"></i>',
//                  callback: function () {}
//                };
//        menuItems.push(menuItem);
        const combatantControlsDiv = combatantElement.getElementsByClassName('combatant-controls')[0];
        const firstChild = combatantControlsDiv.firstElementChild;
        let aCTE = document.createElement("a");
        aCTE.setAttribute('class', 'combat-tracker-extensions-menu combat-tracker-extensions-combatant-control');
        aCTE.setAttribute('id', 'combat-tracker-extensions-menu-' + combatant.id);
        aCTE.setAttribute('data-combatant-id', combatant.id);
        let iCTE = document.createElement("i");
        iCTE.setAttribute('class', 'fas fa-square-ellipsis-vertical');
        iCTE.setAttribute('data-tooltip', moduleTitle);
        aCTE.appendChild(iCTE);
        combatantControlsDiv.insertBefore(aCTE, firstChild);
        new DropDownMenu(combatantControlsDiv, `#combat-tracker-extensions-menu-${combatant.id}`, menuItems,dropDownMenuOptions);
      }
    }
    // Add final phases not already added(with no assigned combatants)
    if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && definedPhases != null) {
      for (let i = currentPhase; i < definedPhases.phases.length; i++) {
        let phaseLi = document.createElement('LI');
        if (i == 0) {
          phaseLi.setAttribute('class', 'combat-tracker-extensions-phase combat-tracker-extensions-phase-first-unused flexrow');
        } else if (i == definedPhases.phases.length - 1) {
          phaseLi.setAttribute('class', 'combat-tracker-extensions-phase combat-tracker-extensions-phase-last flexrow');
        } else {
          phaseLi.setAttribute('class', 'combat-tracker-extensions-phase combat-tracker-extensions-phase-unused flexrow');
        }
        let phaseDiv = document.createElement('DIV');
        phaseDiv.setAttribute('class', 'combat-tracker-extensions-phase');
        let phaseIcon = document.createElement('I');
        phaseIcon.setAttribute('class', 'fas ' + definedPhases.phases[i].icon);
        let phaseTitle = document.createElement('H3');
        phaseTitle.appendChild(phaseIcon);
        phaseTitle.innerHTML = `<i class="fas ${definedPhases.phases[i].icon}"></i> ${definedPhases.phases[i].name}`;
        phaseDiv.appendChild(phaseTitle);
        let menuItems = null;
        if (game.user.isGM) {
          let aCallGroup = document.createElement('A');
          menuItems = createAssignPhase(aCallGroup, combatTracker, i);
          phaseTitle.appendChild(aCallGroup);
        }

        phaseLi.appendChild(phaseDiv);
        let inserted = combatantOl.appendChild(phaseLi);
        if (menuItems != null) {
          new DropDownMenu(phaseLi, `#combat-tracker-extensions-menu-phase-${i}`, menuItems,dropDownMenuOptions);
        }

      }
    }
    // add super tools for gms. but only if there is an encounter(otherwise any command will get error)
    if (game.user.isGM && combatTracker.viewed!=null) {
      const encounterControls = html.find('.encounter-controls')[0];
      const firstChild = encounterControls.firstElementChild;
      let aCTE = document.createElement("a");
      aCTE.setAttribute('class', 'combat-button combat-control');
      aCTE.setAttribute('id', `combat-tracker-extensions-control-menu-${combatTrackerId}`);

      let iCTE = document.createElement("i");
      iCTE.setAttribute('class', 'fas fa-square-ellipsis-vertical');
      iCTE.setAttribute('data-tooltip', moduleTitle);
      aCTE.appendChild(iCTE);
      encounterControls.insertBefore(aCTE, firstChild);
      let menuItems = [
        {
          name: "COMBAT.MenuReveal",
          icon: '<i class="fas fa-eye"></i>',
          submenuitems: [
            {
              name: "COMBAT.SelectorAll",
              icon: '<i class="fas fa-head-side fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  await combatant.update({hidden: false});
                }
              }
            },
            {separator: true},
            {
              name: "COMBAT.SelectorAllPlayers",
              icon: '<i class="fas fa-head-side-brain fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (!combatant.isNPC) {
                    await combatant.update({hidden: false});
                  }
                }
              }
            },
            {separator: true},
            {
              name: "COMBAT.SelectorAllNPCs",
              icon: '<i class="fas fa-face-meh-blank fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC) {
                    await combatant.update({hidden: false});
                  }
                }
              }
            },
            {
              name: "COMBAT.SelectorAllNPCsFriendly",
              icon: '<i class="fas fa-face-smile fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
                    await combatant.update({hidden: false});
                  }
                }
              }
            },
            {
              name: "COMBAT.SelectorAllNPCsNeutral",
              icon: '<i class="fas fa-face-meh fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.NEUTRAL) {
                    await combatant.update({hidden: false});
                  }
                }
              }
            },
            {
              name: "COMBAT.SelectorAllNPCsHostile",
              icon: '<i class="fas fa-face-angry fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                    await combatant.update({hidden: false});
                  }
                }
              }
            },
            {
              name: "COMBAT.SelectorAllNPCsSecret",
              icon: '<i class="fas fa-face-hand-over-mouth fa-fw"></i>',
              condition: isNewerVersion(game.version, 11),
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.SECRET) {
                    await combatant.update({hidden: false});
                  }
                }
              }
            }
          ]
        }
        ,
        {
          name: "COMBAT.MenuHide",
          icon: '<i class="fas fa-eye-slash"></i>',
          submenuitems: [
            {
              name: "COMBAT.SelectorAll",
              icon: '<i class="fas fa-head-side fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  await combatant.update({hidden: true});
                }
              }
            },
            {separator: true},
            {
              name: "COMBAT.SelectorAllPlayers",
              icon: '<i class="fas fa-head-side-brain fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (!combatant.isNPC) {
                    await combatant.update({hidden: true});
                  }
                }
              }
            },
            {separator: true},
            {
              name: "COMBAT.SelectorAllNPCs",
              icon: '<i class="fas fa-face-meh-blank fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC) {
                    await combatant.update({hidden: true});
                  }
                }
              }
            },
            {
              name: "COMBAT.SelectorAllNPCsFriendly",
              icon: '<i class="fas fa-face-smile fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
                    await combatant.update({hidden: true});
                  }
                }
              }
            },
            {
              name: "COMBAT.SelectorAllNPCsNeutral",
              icon: '<i class="fas fa-face-meh fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.NEUTRAL) {
                    await combatant.update({hidden: true});
                  }
                }
              }
            },
            {
              name: "COMBAT.SelectorAllNPCsHostile",
              icon: '<i class="fas fa-face-angry fa-fw"></i>',
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                    await combatant.update({hidden: true});
                  }
                }
              }
            },
            {
              name: "COMBAT.SelectorAllNPCsSecret",
              icon: '<i class="fas fa-face-hand-over-mouth fa-fw"></i>',
              condition: isNewerVersion(game.version, 11),
              callback: async a => {
                for (const combatant of combatTracker.viewed.combatants) {
                  if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.SECRET) {
                    await combatant.update({hidden: true});
                  }
                }
              }
            }
          ]
        }
      ];
      if (OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING) {
        let menuMaskItems = [

          {
            name: "COMBAT.MenuUnMask",
            icon: '<i class="fas fa-glasses"></i>',
            submenuitems: [
              {
                name: "COMBAT.SelectorAll",
                icon: '<i class="fas fa-head-side fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    let flagUnknown = {combattrackerextensions: {maskname: false}};
                    await combatant.update({flags: flagUnknown});
                  }
                }
              },
              {separator: true},
              {
                name: "COMBAT.SelectorAllPlayers",
                icon: '<i class="fas fa-head-side-brain fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (!combatant.isNPC) {
                      let flagUnknown = {combattrackerextensions: {maskname: false}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {separator: true},
              {
                name: "COMBAT.SelectorAllNPCs",
                icon: '<i class="fas fa-face-meh-blank fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC) {
                      let flagUnknown = {combattrackerextensions: {maskname: false}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsFriendly",
                icon: '<i class="fas fa-face-smile fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
                      let flagUnknown = {combattrackerextensions: {maskname: false}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsNeutral",
                icon: '<i class="fas fa-face-meh fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.NEUTRAL) {
                      let flagUnknown = {combattrackerextensions: {maskname: false}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsHostile",
                icon: '<i class="fas fa-face-angry fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                      let flagUnknown = {combattrackerextensions: {maskname: false}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsSecret",
                icon: '<i class="fas fa-face-hand-over-mouth fa-fw"></i>',
                condition: isNewerVersion(game.version, 11),
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.SECRET) {
                      let flagUnknown = {combattrackerextensions: {maskname: false}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              }
            ]
          },

          {
            name: "COMBAT.MenuMask",
            icon: '<i class="fas fa-mask"></i>',
            submenuitems: [
              {
                name: "COMBAT.SelectorAll",
                icon: '<i class="fas fa-head-side fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    let flagUnknown = {combattrackerextensions: {maskname: true}};
                    await combatant.update({flags: flagUnknown});
                  }
                }
              },
              {separator: true},
              {
                name: "COMBAT.SelectorAllPlayers",
                icon: '<i class="fas fa-head-side-brain fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (!combatant.isNPC) {
                      let flagUnknown = {combattrackerextensions: {maskname: true}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {separator: true},
              {
                name: "COMBAT.SelectorAllNPCs",
                icon: '<i class="fas fa-face-meh-blank fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC) {
                      let flagUnknown = {combattrackerextensions: {maskname: true}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsFriendly",
                icon: '<i class="fas fa-face-smile fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
                      let flagUnknown = {combattrackerextensions: {maskname: true}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsNeutral",
                icon: '<i class="fas fa-face-meh fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.NEUTRAL) {
                      let flagUnknown = {combattrackerextensions: {maskname: true}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsHostile",
                icon: '<i class="fas fa-face-angry fa-fw"></i>',
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                      let flagUnknown = {combattrackerextensions: {maskname: true}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsSecret",
                icon: '<i class="fas fa-face-hand-over-mouth fa-fw"></i>',
                condition: isNewerVersion(game.version, 11),
                callback: async a => {
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.SECRET) {
                      let flagUnknown = {combattrackerextensions: {maskname: true}};
                      await combatant.update({flags: flagUnknown});
                    }
                  }
                }
              }
            ]
          }
        ];
        menuItems = menuItems.concat(menuMaskItems);
      }

      if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && definedPhases != null) {
        aCTE.setAttribute('data-unset-phase-index', definedPhases.phases.length - 1);
        let phaseMenuItems = [

          {
            name: "COMBAT.MenuUnset",
            icon: '<i class="fas fa-question"></i>',
            submenuitems: [
              {
                name: "COMBAT.SelectorAll",
                icon: '<i class="fas fa-head-side fa-fw"></i>',
                callback: async a => {
                  const phaseIndex = a.data("unset-phase-index");
                  for (const combatant of combatTracker.viewed.combatants) {
                    const flags = {combattrackerextensions: {phase: phaseIndex}};
                    await combatant.update({flags: flags});
                  }
                }
              },
              {separator: true},
              {
                name: "COMBAT.SelectorAllPlayers",
                icon: '<i class="fas fa-head-side-brain fa-fw"></i>',
                callback: async a => {
                  const phaseIndex = a.data("unset-phase-index");
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (!combatant.isNPC) {
                      const flags = {combattrackerextensions: {phase: phaseIndex}};
                      await combatant.update({flags: flags});
                    }
                  }
                }
              },
              {separator: true},
              {
                name: "COMBAT.SelectorAllNPCs",
                icon: '<i class="fas fa-face-meh-blank fa-fw"></i>',
                callback: async a => {
                  const phaseIndex = a.data("unset-phase-index");
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC) {
                      const flags = {combattrackerextensions: {phase: phaseIndex}};
                      await combatant.update({flags: flags});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsFriendly",
                icon: '<i class="fas fa-face-smile fa-fw"></i>',
                callback: async a => {
                  const phaseIndex = a.data("unset-phase-index");
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
                      const flags = {combattrackerextensions: {phase: phaseIndex}};
                      await combatant.update({flags: flags});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsNeutral",
                icon: '<i class="fas fa-face-meh fa-fw"></i>',
                callback: async a => {
                  const phaseIndex = a.data("unset-phase-index");
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.NEUTRAL) {
                      const flags = {combattrackerextensions: {phase: phaseIndex}};
                      await combatant.update({flags: flags});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsHostile",
                icon: '<i class="fas fa-face-angry fa-fw"></i>',
                callback: async a => {
                  const phaseIndex = a.data("unset-phase-index");
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                      const flags = {combattrackerextensions: {phase: phaseIndex}};
                      await combatant.update({flags: flags});
                    }
                  }
                }
              },
              {
                name: "COMBAT.SelectorAllNPCsSecret",
                icon: '<i class="fas fa-face-hand-over-mouth fa-fw"></i>',
                condition: isNewerVersion(game.version, 11),
                callback: async a => {
                  const phaseIndex = a.data("unset-phase-index");
                  for (const combatant of combatTracker.viewed.combatants) {
                    if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.SECRET) {
                      const flags = {combattrackerextensions: {phase: phaseIndex}};
                      await combatant.update({flags: flags});
                    }
                  }
                }
              }
            ]
          }
        ];
        menuItems = menuItems.concat(phaseMenuItems);
      }
      // should offset downvertical by 9
      dropDownMenuOptions.downVerticalAdjustment=9;
      new DropDownMenu(encounterControls, `#combat-tracker-extensions-control-menu-${combatTrackerId}`, menuItems, dropDownMenuOptions);
      
    }
  }
});

Hooks.on('refreshToken', async (token, options) => {
  //console.log('refreshToken',token, options);
  if (!game.user.isGM) {
    const OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS.ID);
    if (OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS && !token.isOwner) {
      token.effects.visible = false;
    }
  }
});

function createAssignPhase(aCallGroup, combatTracker, phaseIndex) {

  aCallGroup.setAttribute('id', 'combat-tracker-extensions-menu-phase-' + phaseIndex);
  aCallGroup.setAttribute('data-phase-index', phaseIndex);
  aCallGroup.setAttribute('class', 'combat-tracker-extensions-menu-phase-assign');
  let iCallGroup = document.createElement('I');
  iCallGroup.setAttribute('class', 'fas fa-arrow-down-to-square');
  iCallGroup.setAttribute('data-tooltip', game.i18n.localize("COMBAT.PhaseAssign"));
  aCallGroup.appendChild(iCallGroup);

  let menuItems = [
    {
      name: "COMBAT.SelectorAll",
      icon: '<i class="fas fa-head-side"></i>',
      callback: async a => {
        const phaseIndex = a.data("phase-index");
        for (const combatant of combatTracker.viewed.combatants) {
          const flags = {combattrackerextensions: {phase: phaseIndex}};
          await combatant.update({flags: flags});
        }
      }
    },

    {separator: true},
    {
      name: "COMBAT.SelectorAllPlayers",
      icon: '<i class="fas fa-head-side-brain"></i>',
      callback: async a => {
        const phaseIndex = a.data("phase-index");
        for (const combatant of combatTracker.viewed.combatants) {
          if (!combatant.isNPC) {
            const flags = {combattrackerextensions: {phase: phaseIndex}};
            await combatant.update({flags: flags});
          }
        }
      }
    },
    {separator: true},

    {
      name: "COMBAT.SelectorAllNPCs",
      icon: '<i class="fas fa-face-meh-blank fa-fw"></i>',
      callback: async a => {
        const phaseIndex = a.data("phase-index");
        for (const combatant of combatTracker.viewed.combatants) {
          if (combatant.isNPC) {
            const flags = {combattrackerextensions: {phase: phaseIndex}};
            await combatant.update({flags: flags});
          }
        }
      }
    },
    {
      name: "COMBAT.SelectorAllNPCsFriendly",
      icon: '<i class="fas fa-face-smile fa-fw"></i>',
      callback: async a => {
        const phaseIndex = a.data("phase-index");
        for (const combatant of combatTracker.viewed.combatants) {
          if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
            const flags = {combattrackerextensions: {phase: phaseIndex}};
            await combatant.update({flags: flags});
          }
        }
      }
    },
    {
      name: "COMBAT.SelectorAllNPCsNeutral",
      icon: '<i class="fas fa-face-meh fa-fw"></i>',
      callback: async a => {
        const phaseIndex = a.data("phase-index");
        for (const combatant of combatTracker.viewed.combatants) {
          if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.NEUTRAL) {
            const flags = {combattrackerextensions: {phase: phaseIndex}};
            await combatant.update({flags: flags});
          }
        }
      }
    },
    {
      name: "COMBAT.SelectorAllNPCsHostile",
      icon: '<i class="fas fa-face-angry fa-fw"></i>',
      callback: async a => {
        const phaseIndex = a.data("phase-index");
        for (const combatant of combatTracker.viewed.combatants) {
          if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.HOSTILE) {
            const flags = {combattrackerextensions: {phase: phaseIndex}};
            await combatant.update({flags: flags});
          }
        }
      }
    },
    {
      name: "COMBAT.SelectorAllNPCsSecret",
      icon: '<i class="fas fa-face-hand-over-mouth fa-fw"></i>',
      condition: isNewerVersion(game.version, 11),
      callback: async a => {
        const phaseIndex = a.data("phase-index");
        for (const combatant of combatTracker.viewed.combatants) {
          if (combatant.isNPC && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.SECRET) {
            const flags = {combattrackerextensions: {phase: phaseIndex}};
            await combatant.update({flags: flags});
          }
        }
      }
    }


  ];
  return menuItems;
}








