const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { libWrapper } from './shim.js';
import { SETTINGATTRIBUTE } from "./setting-constants.js"
import { settingsMenus, settingsRegistration, getModuleSetting } from "./settings-registration.js";
import { wrappedSortCombatants, wrappedOnHoverIn, wrappedOnHoverOut, wrappedOnToggleDefeatedStatus,
        _getCombatantsSharingToken, wrappedDisplayScrollingStatus, wrappedRollAll, wrappedRollNPC, wrappedManageTurnEvents } from "./fvttt_core_overrides.js";
import { DropDownMenu } from "./dropdownmenu.js";
import { GroupEditorForm } from "./group-editor-form.js";
import { CombatTrackerExtensionsPhaseEditorForm } from "./phase-editor-form.js";
import { CombatTrackerExtensionsRoundSetEditorForm } from "./roundset-editor-form.js";

import { getInitiativeGroups, getInitiativeGroup, addInitiativeGroup,
        leaveInitiativeGroup, joinInitiativeGroup, createInitiativeGroup,
        getInitiativeGroupCombatants, clearAllInitiativeGroups, deleteAllInitiativeGroups,
        getCombatInitiativeGroup, leadInitiativeGroup } from "./initiative-groups.js"
import { customDialogConfirm } from "./custom-dialogs.js";
import { ModuleSettingsForm } from "./module-settings-form.js";

let boundryMarkerId;
let centerMarkerId;
// Note about colors. NPC(without disposition) does not have an official Foundry color
const DISPOSITIONS = {
  FRIENDLY: {COLOR: "#43DFE9", MONO: "#1AD3DF", GROUPID: "6nlGabVNtpavt6CK"},
  NEUTRAL: {COLOR: "#F1D836", MONO: "#E4C810", GROUPID: "gmaaVcoPd421GYAB"},
  HOSTILE: {COLOR: "#E72124", MONO: "#C01517", GROUPID: "hVu9ocnyN9OPN7i0"},
  SECRET: {COLOR: "#A612D4", MONO: "#BF2CED", GROUPID: "KZCfrFXHgzJ4fBG0"},
  PARTY: {COLOR: "#33BC4E", MONO: "#52D06B", GROUPID: "GCJTfZqqO8WCRxlz"},
  NPC: {COLOR: "#0077EA", MONO: "#1E90FF", GROUPID: "24birPpizUENRRdE"}
};

Hooks.on('init', _onInit);
Hooks.on("ready", _onReady);


let OPTION_COMBAT_TRACKER_PHASE_UNSET_NAME = '';

async function _onInit() {
  console.log(`${moduleTitle} | Initializing ${moduleTitle} module`);
  await settingsMenus(moduleId);
  await settingsRegistration(moduleId);
  // Foundry core patch for v11 for combat bug https://github.com/foundryvtt/foundryvtt/issues/9718
  // should be fixed in v12
  if (isNewerVersion(game.version, 11) && !isNewerVersion(game.version, 12)) {
    console.log(`${moduleTitle} | Overriding _manageTurnEvents(Issue https://github.com/foundryvtt/foundryvtt/issues/9718)`);
    libWrapper.register(moduleId, 'Combat.prototype._manageTurnEvents', wrappedManageTurnEvents);
  } else if (isNewerVersion(game.version, 12)) {
    console.warn(`${moduleTitle} | Developer note: Verify that this bug is fixed in v12 for _manageTurnEvents(Issue https://github.com/foundryvtt/foundryvtt/issues/9718)`);
  }


  OPTION_COMBAT_TRACKER_PHASE_UNSET_NAME = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_PHASE_UNSET_NAME.ID);
  console.log(`${moduleTitle} | Settings up overrides`);
  if (getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID) || getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID) || getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_GROUPS.ID)) {
    // check for valid defined phases
    console.log(`${moduleTitle} | Overriding default combatant sorting`);
    libWrapper.register(moduleId, 'Combat.prototype._sortCombatants', wrappedSortCombatants);
    // if pf2e. pf2e has so much modifications to foundry core so it is not worth putting in to much work to make it work
    if(game.system.id=='pf2e'){
      libWrapper.register(moduleId, 'EncounterPF2e.prototype._sortCombatants', wrappedSortCombatants);
    }
  }

  if (getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_GROUPS.ID)) {
    // check for valid defined phases
    console.log(`${moduleTitle} | Overriding default combat rolls`);
    libWrapper.register(moduleId, 'Combat.prototype.rollAll', wrappedRollAll);
    libWrapper.register(moduleId, 'Combat.prototype.rollNPC', wrappedRollNPC);
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

//Hooks.on("canvasPan", async(canvas, position) => {
//  console.log(position);
//});

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

Hooks.on("updateCombatant", async(combatant, data, options, userid) => {
  //console.log('updateCombatant', combatant.name, combatant, data, options);
  //console.log('updateCombatant', combatant.name, data);
  const OPTION_COMBAT_TRACKER_ENABLE_GROUPS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_GROUPS.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID);
  const OPTION_COMBAT_TRACKER_SHARING_GROUPS_SHARE_PHASE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHARING_GROUPS_SHARE_PHASE.ID);
  // only trigger updates for the group if update comes from the same user
  if (userid == game.user.id && game.user.isGM && OPTION_COMBAT_TRACKER_ENABLE_GROUPS) {
    const groupid = getInitiativeGroup(combatant);
    let hasJoinedGroup = data?.flags?.combattrackerextensions?.initiativegroup?.id ?? null;
    if (hasJoinedGroup != null) {
      // get the current init from the groups first member
      const initiativeGroup = getCombatInitiativeGroup(combatant.combat, hasJoinedGroup);
      //console.log('updateCombatant', combatant.name, ' joined ', initiativeGroup.name);
      if (initiativeGroup.sharesinitiative) {
        const initiativeGroupCombatants = getInitiativeGroupCombatants(combatant.combat, hasJoinedGroup);
        const firstOtherGroupMember = initiativeGroupCombatants.find(y => y.id != combatant.id);
        if (firstOtherGroupMember != null) {
          const currentGroupInitiativeValue = firstOtherGroupMember.initiative;
          await combatant.update({initiative: currentGroupInitiativeValue}, {joinedgroup: true});
          // check for phases
          if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && OPTION_COMBAT_TRACKER_SHARING_GROUPS_SHARE_PHASE) {
            let hasChangedPhase = firstOtherGroupMember.flags?.combattrackerextensions?.phase ?? 999;
            const flagData = {combattrackerextensions: {phase: hasChangedPhase}};
            await combatant.update({flags: flagData}, {groupphase: false});
          }
        }
      }
    }

    if (data.hasOwnProperty('initiative')) {
      // check if in a in a group      
      if (groupid != null) {
        const isGroupInitiative = options?.groupinitiative ?? false;
        if (!isGroupInitiative) {
          const initiativeGroup = getCombatInitiativeGroup(combatant.combat, groupid);
          if (initiativeGroup.sharesinitiative) {
            //console.log('updateCombatant', combatant.name, ' updating group', initiativeGroup.name);
            const initiativeGroupCombatants = getInitiativeGroupCombatants(combatant.combat, groupid);
            for (let i = 0; i < initiativeGroupCombatants.length; i++) {
              if (initiativeGroupCombatants[i].id != combatant.id) {
                //console.log(combatant.name, 'updating group member ', initiativeGroupCombatants[i].name);
                await initiativeGroupCombatants[i].update({initiative: data.initiative}, {groupinitiative: true});
              }
            }
          }
        }
      }
    }
    if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && OPTION_COMBAT_TRACKER_SHARING_GROUPS_SHARE_PHASE) {
      // also check for phases changes
      let hasChangedPhase = data?.flags?.combattrackerextensions?.phase ?? null;
      if (hasChangedPhase != null) {
        if (groupid != null) {
          const groupphase = options?.groupphase ?? false;
          if (!groupphase) {
            const initiativeGroup = getCombatInitiativeGroup(combatant.combat, groupid);
            if (initiativeGroup.sharesinitiative) {
              //console.log('updateCombatant', combatant.name, ' updating group', initiativeGroup.name);
              const initiativeGroupCombatants = getInitiativeGroupCombatants(combatant.combat, groupid);
              for (let i = 0; i < initiativeGroupCombatants.length; i++) {
                if (initiativeGroupCombatants[i].id != combatant.id) {
                  if (initiativeGroupCombatants[i].flags?.combattrackerextensions?.phase != hasChangedPhase) {
                    //console.log(combatant.name, 'updating group member phase for', initiativeGroupCombatants[i].name);
                    const flagData = {combattrackerextensions: {phase: hasChangedPhase}};
                    await initiativeGroupCombatants[i].update({flags: flagData}, {groupphase: true});
                  }
                }
              }
            }
          }
        }
      }
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
  const OPTION_COMBAT_TRACKER_ENABLE_BASIC_COMMANDS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_BASIC_COMMANDS.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_GROUPS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_GROUPS.ID);

  if (OPTION_COMBAT_TRACKER_ENABLE_GROUPS || OPTION_COMBAT_TRACKER_ENABLE_BASIC_COMMANDS || OPTION_COMBAT_TRACKER_ENABLE_ROUNDSET || OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT || OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS || OPTION_COMBAT_TRACKER_SHOW_TOKEN_EFFECT_TOOLTIPS || OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_PAN_TO_TOKEN || OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE || OPTION_COMBAT_TRACKER_ENABLE_VISIBILITY_TOGGLE || OPTION_COMBAT_TRACKER_ENABLE_PHASES || OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS || OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_PLAYERS || OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT || OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING || OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS || OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS || OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD) {
    const COMBAT_ACTIVE = combatTracker.viewed != null;
    const combatTrackerId = html[0].id;
    const isPoppedOut = (combatTrackerId == 'combat-popout');
    let downVerticalAdjustment = 0;
    let upVerticalAdjustment = 0;
    let leftHorizontalAdjustment = 0;
    let rightHorizontalAdjustment = 0;
    let trackerRect = html[0].getBoundingClientRect();
    let windowElementSelector = null;
    if (isPoppedOut) {
      windowElementSelector = '#combat-popout';

    }
    let dropDownMenuOptions = {
      downVerticalAdjustment: downVerticalAdjustment,
      upVerticalAdjustment: upVerticalAdjustment,
      leftHorizontalAdjustment: leftHorizontalAdjustment,
      rightHorizontalAdjustment: rightHorizontalAdjustment,
      windowElementSelector: windowElementSelector
    };

    if (OPTION_COMBAT_TRACKER_ENABLE_ROUNDSET) {
      const OPTION_COMBAT_TRACKER_DEFINED_ROUNDSET = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_DEFINED_ROUNDSET.ID);
      if (OPTION_COMBAT_TRACKER_DEFINED_ROUNDSET.length > 0) {
        let definedRoundSet = JSON.parse(OPTION_COMBAT_TRACKER_DEFINED_ROUNDSET);
        if (definedRoundSet != null) {
          // get current round
          const  currentRound = combatTracker?.viewed?.round ?? 0;
          if (currentRound > 0 && definedRoundSet.rounds.length > 0) {
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
            let roundTooltip = `<div class="combat-tracker-extensions-roundset-current-round-set">Round Set ${adjustedRound}</div><ul class="combat-tracker-extensions-roundset-tooltip">`;
            for (var i = 0; i < definedRoundSet.rounds.length; i++) {
              let currentRoundMarker = ``;
              if (i == currentRoundSetRound - 1) {
                currentRoundMarker = `<i class="fas fa-right-long"></i>`;
              }
              roundTooltip += `<li><span class="combat-tracker-extensions-roundset-current-turn-marker">${currentRoundMarker}</span><i class="fas ${definedRoundSet.rounds[i].icon}"></i> ${definedRoundSet.rounds[i].name}</li>`;
            }
            roundTooltip += `</ul>`;
            roundTooltip += `<div class="combat-tracker-extensions-roundset-current-round">Foundry Round ${currentRound}</div>`;
            encounterTitle.setAttribute('data-tooltip', roundTooltip);
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
      const phaseUnset = {name: OPTION_COMBAT_TRACKER_PHASE_UNSET_NAME, icon: 'fa-question'};
      definedPhases.phases.push(phaseUnset);
    }
    const combatants = html.find('.combatant');
    const combatantOl = html.find('#combat-tracker')[0];

    let currentPhase = 0;
    for (const combatantElement of combatants) {
      const combatant = await game.combat.combatants.get(combatantElement.dataset.combatantId);
      //console.log(combatant);
      let token = await combatant.token;
      let isOwner;
      if (token == null) {
        isOwner = false;
      } else {
        isOwner = token.isOwner;
      }

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
            aCallGroup.setAttribute('data-unset-phase-index', definedPhases.phases.length - 1);
            menuItems = createAssignPhase(aCallGroup, combatTracker, i);
            phaseTitle.appendChild(aCallGroup);
          }
          phaseLi.appendChild(phaseDiv);
          let inserted = combatantOl.insertBefore(phaseLi, combatantElement);
          if (menuItems != null) {
            new DropDownMenu(phaseLi, `#combat-tracker-extensions-menu-phase-${i}`, menuItems, dropDownMenuOptions);
          }
          currentPhase = combatantPhase + 1;
        }
      }

      if (OPTION_COMBAT_TRACKER_ENABLE_GROUPS && game.user.isGM) {
        const groupId = getInitiativeGroup(combatant);
        if (groupId != null) {
          const initiativeGroups = getInitiativeGroups(combatTracker.viewed);
          const initiativeGroup = initiativeGroups.find(y => y.id == groupId);
          if (initiativeGroup != null) {
            const groupColor = initiativeGroup.color;
            const sharesInitiative = initiativeGroup.sharesinitiative;
            if (groupColor != null && sharesInitiative != null) {
              if (sharesInitiative) {
                combatantElement.style.borderLeft = "thick solid " + groupColor;
              } else {
                combatantElement.style.borderLeft = "thick dashed " + groupColor;
              }
            }
          }
        }
      }
      if ((OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS && game.user.isGM && token) || (OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS && !game.user.isGM && token)) {
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
          switch (token.disposition) {
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
        if (token) {
          if (token.actor) {
            const actorImg = token.actor.img;
            if (actorImg != null) {
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
          }
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
            // initiative not rolled                        
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
          aMask.setAttribute('data-tooltip', game.i18n.localize("COMBATTRACKEREXTENSIONS.ToggleNameMask"));
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
      if (OPTION_COMBAT_TRACKER_SHOW_TOKEN_EFFECT_TOOLTIPS || (!game.user.isGM && OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS && !isOwner)) {
        // delete all default img for token effects               
        tokenEffects.innerHTML = '';
      }
      if (OPTION_COMBAT_TRACKER_SHOW_TOKEN_EFFECT_TOOLTIPS && (game.user.isGM || isOwner && OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS || !OPTION_COMBAT_TRACKER_HIDE_TOKEN_EFFECTS_FOR_PLAYERS)) {
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


        if (combatant.token) {
          // check if token is invisible and add that as an effect
          if (combatant.token.hidden) {
            //effects.add({name:game.i18n.localize("EFFECT.StatusInvisible"),icon:"icons/svg/invisible.svg"});
            addEffect(effects, game.i18n.localize("EFFECT.StatusInvisible"), "icons/svg/invisible.svg");
          }
          for (const effect of combatant.token.effects) {
            //effects.add({name:effect.label,icon:effect.icon});
            addEffect(effects, effect[nameProperty], effect.icon);
          }
          if (combatant.token.overlayEffect) {
            //effects.add({name:"Overlay",icon:combatant.token.overlayEffect});
            addEffect(effects, "Overlay", combatant.token.overlayEffect);
          }
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
          if (OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_PAN_TO_TOKEN && token) {
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
            const OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_NPCS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_NPCS.ID);
            const OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_NON_NPCS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_NON_NPCS.ID);
            const OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_NON_NPCS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_NON_NPCS.ID);
            if (OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT_BY_DISPOSITION && token) {
              const OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_FRIENDLY = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_FRIENDLY.ID);
              const OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_NEUTRAL = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_NEUTRAL.ID);
              const OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_HOSTILE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_HOSTILE.ID);
              const OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_SECRET = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_SECRET.ID);

              const OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_FRIENDLY = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_FRIENDLY.ID);
              const OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_NEUTRAL = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_NEUTRAL.ID);
              const OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_HOSTILE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_HOSTILE.ID);
              const OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_SECRET = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_SECRET.ID);
              // check disposition
              switch (token.disposition) {
                case CONST.TOKEN_DISPOSITIONS.FRIENDLY:
                  hideInitiativeValue = OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_FRIENDLY;
                  hideCombatantEntry = OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_FRIENDLY;
                  break;
                case CONST.TOKEN_DISPOSITIONS.NEUTRAL:
                  hideInitiativeValue = OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_NEUTRAL;
                  hideCombatantEntry = OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_NEUTRAL;
                  break;
                case CONST.TOKEN_DISPOSITIONS.HOSTILE:
                  hideInitiativeValue = OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_HOSTILE;
                  hideCombatantEntry = OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_HOSTILE;
                  break;
                case CONST.TOKEN_DISPOSITIONS.SECRET:
                  hideInitiativeValue = OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_SECRET;
                  hideCombatantEntry = OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_SECRET;
                  break;
                default:
                  break;
              }
            }
            if (combatant.isNPC && OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_NPCS) {
              hideInitiativeValue = true;
              hideCombatantEntry = true;
              hideCombatantName = true;
            }
            if (!combatant.isNPC && OPTION_COMBAT_TRACKER_HIDE_INITIATIVES_NON_NPCS) {
              hideInitiativeValue = true;
            }
            if (!combatant.isNPC && OPTION_COMBAT_TRACKER_HIDE_COMBATANTS_NON_NPCS) {
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
          if (isOwner) {
            hideInitiativeValue = false;
            hideCombatantEntry = false;
            hideCombatantName = false;
          }
          if (OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING && hideCombatantName) {
            nameDiv.firstElementChild.innerText = game.i18n.localize("COMBATTRACKEREXTENSIONS.UnknownCombatant");
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
      if (OPTION_COMBAT_TRACKER_ENABLE_BASIC_COMMANDS && game.user.isGM) {
        let menuItemsBasicCommands =
                {
                  name: "COMBATTRACKEREXTENSIONS.ChangeToActive",
                  icon: '<i class="fas fa-arrows-to-line"></i>',
                  callback: async a => {
                    const combatantId = a.data("combatant-id");
                    const combatantTurn = combatTracker.viewed.turns.findIndex(i => i.id == combatantId);
                    //console.log(combatantTurn)
                    await combatTracker.viewed.update({turn: combatantTurn});
                  }
                };
        menuItems.push(menuItemsBasicCommands);
      }

      // -------------------------
      // CHANGE PHASES
      // -------------------------
      const OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_CHANGE_PHASE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_CHANGE_PHASE.ID);
      // change phase if any both for gm and players
      if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && definedPhases != null && (game.user.isGM || OPTION_COMBAT_TRACKER_ENABLE_PLAYERS_CHANGE_PHASE && isOwner)) {
        let combatantPhase = combatant.flags?.combattrackerextensions?.phase ?? 999;
        if (combatantPhase == 999 || combatantPhase == -1) {
          combatantPhase = definedPhases.phases.length - 1;
        }
        if (menuItems.length > 0) {
          menuItems.push({separator: true});
        }
        for (let i = 0; i < definedPhases.phases.length; i++) {
          const cid = combatant.id;
          let phasemenuItem = {
            name: game.i18n.format("COMBATTRACKEREXTENSIONS.ChangePhase", {phasename: definedPhases.phases[i].name}),
            icon: `<i class="fas ${definedPhases.phases[i].icon}"></i>`,
            condition: combatantPhase != i,
            callback: async a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const flags = {combattrackerextensions: {phase: i}};
              await combatant.update({flags: flags});
            }
          };

          menuItems.push(phasemenuItem);
        }

      }
      // TOKEN INVISIBILITY
      if (OPTION_COMBAT_TRACKER_ENABLE_VISIBILITY_TOGGLE && game.user.isGM && token) {
        let isTokenInVisible = token.hidden;
        let invisibleIcon;
        let initImg = combatantElement.getElementsByClassName('token-image')[0];
        if (isTokenInVisible) {
          invisibleIcon = 'far fa-user';
        } else {
          invisibleIcon = 'fas fa-user';
        }
        if (menuItems.length > 0) {
          menuItems.push({separator: true});
        }
        menuItem = {
          name: "COMBATTRACKEREXTENSIONS.ToggleTokenVisibility",
          icon: `<i class="${invisibleIcon}"></i>`,

          callback: async a => {
            const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
            const token = combatant.token;
            await token.update({hidden: !isTokenInVisible});
          }
        };
        menuItems.push(menuItem);

      }

      // -----------------
      // CHANGE DISPOSTION
      // -----------------
      if (OPTION_COMBAT_TRACKER_ENABLE_DISPOSITION_CHANGE && game.user.isGM && token) {
        const tokenDisposition = token.disposition;
        if (menuItems.length > 0) {
          menuItems.push({separator: true});
        }
        let menuItemsDisposition = [
          {
            name: "COMBATTRACKEREXTENSIONS.ChangeDispositionToFriendly",
            icon: '<i class="fas fa-face-smile"></i>',
            condition: tokenDisposition != CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            callback: async a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const token = combatant.token;
              await token.update({disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY});
            }
          },
          {
            name: "COMBATTRACKEREXTENSIONS.ChangeDispositionToNeutral",
            icon: '<i class="fas fa-face-meh"></i>',
            condition: tokenDisposition != CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            callback: async a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const token = combatant.token;
              await token.update({disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL});
            }
          },
          {
            name: "COMBATTRACKEREXTENSIONS.ChangeDispositionToHostile",
            icon: '<i class="fas fa-face-angry"></i>',
            condition: tokenDisposition != CONST.TOKEN_DISPOSITIONS.HOSTILE,
            callback: async a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const token = combatant.token;
              await token.update({disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE});
            }
          },
          {
            name: "COMBATTRACKEREXTENSIONS.ChangeDispositionToSecret",
            icon: '<i class="fas fa-face-hand-over-mouth"></i>',
            condition: isNewerVersion(game.version, 11) && tokenDisposition != CONST.TOKEN_DISPOSITIONS.SECRET,
            callback: async a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              const token = combatant.token;
              await token.update({disposition: CONST.TOKEN_DISPOSITIONS.SECRET});
            }
          }

        ];
        menuItems = menuItems.concat(menuItemsDisposition);

      }
      if (OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT && game.user.isGM && token) {
        if (menuItems.length > 0) {
          menuItems.push({separator: true});
        }
        let menuItemAddDuplicate = {
          name: "COMBATTRACKEREXTENSIONS.DuplicateCombatant",
          icon: '<i class="far fa-copy"></i>',
          callback: a => {
            const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
            combatTracker.viewed.createEmbeddedDocuments("Combatant", [combatant]);
          }
        };
        menuItems.push(menuItemAddDuplicate);

        let menuItemRemoveAllDuplicates = {
          name: "COMBATTRACKEREXTENSIONS.RemoveAllDuplicates",
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
      if (OPTION_COMBAT_TRACKER_ENABLE_GROUPS && game.user.isGM) {
        // check if combatant is part of any group                
        //let groupId=combatant.flags?.combattrackerextensions?.initiativegroup?.id ?? null;
        const groupId = getInitiativeGroup(combatant);
        if (menuItems.length > 0) {
          menuItems.push({separator: true});
        }
        if (groupId == null) {
          // option to create group
          let menuCreateGroupItem = {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromToken",
            icon: '<i class="fas fa-users-medical"></i>',
            tooltip: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromTokenHint",
            condition: token,
            callback: async a => {
              const combat = combatTracker.viewed;
              const combatant = combat.combatants.get(a.data("combatant-id"));
              // create group based on this token
              const tokenid = token.id;
              const groupName = combatant.name;
              const initiativeGroup = createInitiativeGroup(combat, groupName, tokenid);
              // add this combatant
              await joinInitiativeGroup(combatant, initiativeGroup.id);
              // add group to all combatants with this token
              let combatants = combat.combatants.filter(y => (y.token != null && y.token.id == tokenid));
              for (let i = 0; i < combatants.length; i++) {
                if (combatants[i].id != combatant.id)
                  await joinInitiativeGroup(combatants[i], initiativeGroup.id);
              }
            }
          };
          menuItems.push(menuCreateGroupItem);
          // create group with all actors of this combatant          
          let menuCreateGroupFromActorItem = {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromActor",
            icon: '<i class="fas fa-users-medical"></i>',
            tooltip: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromActorHint",
            condition: token,
            callback: async a => {
              const combat = combatTracker.viewed;
              const combatant = combat.combatants.get(a.data("combatant-id"));
              // create group based on this combatant actor              
              const actor = game.actors.get(token.actor.id);
              const actorId = actor.id;
              const groupName = actor.name;
              const initiativeGroup = createInitiativeGroup(combat, groupName, actorId);
              // add this combatant
              await joinInitiativeGroup(combatant, initiativeGroup.id);
              // add group to all combatant based on this actor
              let combatants = combat.combatants.filter(y => (y.actor != null && y.actor.id == actorId));
              for (let i = 0; i < combatants.length; i++) {
                if (combatants[i].id != combatant.id)
                  await joinInitiativeGroup(combatants[i], initiativeGroup.id);
              }

            }
          };
          menuItems.push(menuCreateGroupFromActorItem);
          //
          let menuCreateGroupFromActorFolderItem = {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromActorFolder",
            icon: '<i class="fas fa-users-medical"></i>',
            tooltip: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromActorFolderHint",
            condition: token,
            callback: async a => {
              const combat = combatTracker.viewed;
              const combatant = combat.combatants.get(a.data("combatant-id"));
              // create group based on this combatant actor              
              const actor = game.actors.get(token.actor.id);
              const folderId = actor.folder?.id ?? null;
              const folder = game.folders.get(folderId);
              const groupName = folder?.name ?? 'Actors';
              const folderColor = folder?.color ?? null;

              const initiativeGroup = createInitiativeGroup(combat, groupName, folderId, folderColor);
              // add this combatant
              await joinInitiativeGroup(combatant, initiativeGroup.id);
              // add group to all combatant based on this actor
              let combatants = combat.combatants.filter(y => ((folderId != null && y.actor != null && y.actor.folder != null && y.actor.folder.id == folderId)) || (folderId == null && y.actor != null && y.actor.folder == null));
              for (let i = 0; i < combatants.length; i++) {
                if (combatants[i].id != combatant.id)
                  await joinInitiativeGroup(combatants[i], initiativeGroup.id);
              }

            }
          };
          menuItems.push(menuCreateGroupFromActorFolderItem);

          // option to join group
          let combat = combatTracker.viewed;
          let initiativeGroups = getInitiativeGroups(combat);
          for (var i = 0; i < initiativeGroups.length; i++) {
            const groupId = initiativeGroups[i].id;
            const groupName = initiativeGroups[i].name;
            const groupColor = initiativeGroups[i].color;
            let tooltip = createInitiativeGroupTooltip(combat, groupId);
            let menuJoinGroupItem = {
              name: game.i18n.format("COMBATTRACKEREXTENSIONS.InitiativeGroupJoin", {initiativegroupname: groupName}),
              icon: `<i class="fas fa-users fa-fw" style="color:${groupColor};"></i>`,
              tooltip: tooltip,
              callback: async a => {
                const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
                // add group to this combatant
                await joinInitiativeGroup(combatant, groupId);
              }
            };
            menuItems.push(menuJoinGroupItem);
          }
        } else {
          let groupName = '';
          let groupColor = '';
          let combat = combatTracker.viewed;
          const initiativeGroups = getInitiativeGroups(combat);
          const initiativeGroup = initiativeGroups.find(y => y.id == groupId);
          if (initiativeGroup != null) {
            groupName = initiativeGroup.name;
            groupColor = initiativeGroup.color;
          }
          let tooltip = createInitiativeGroupTooltip(combat, groupId);
          let group = {
            name: `${groupName}`,
            icon: `<i class="fas fa-users fa-fw" style="color:${groupColor};"></i>`,
            tooltip: tooltip,
            callback: async a => {
              let f = new GroupEditorForm({groupid: groupId});
              f.render(true, {focus: true});
            }
          };
          menuItems.push(group);
          
          // option to become group leader
          let menuLeadGroupItem = {
            name: game.i18n.format("COMBATTRACKEREXTENSIONS.InitiativeGroupLead", {}),
            icon: `<i class="fas fa-users-crown fa-fw" style="color:${groupColor};"></i>`,
            tooltip: tooltip,
            callback: async a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              leadInitiativeGroup(combatant,groupId);
            }
          };
          menuItems.push(menuLeadGroupItem);

          // option to leave group
          let menuLeaveGroupItem = {
            name: game.i18n.format("COMBATTRACKEREXTENSIONS.InitiativeGroupLeave", {initiativegroupname: groupName}),
            icon: `<i class="fas fa-users-slash fa-fw" style="color:${groupColor};"></i>`,
            tooltip: tooltip,
            callback: async a => {
              const combatant = combatTracker.viewed.combatants.get(a.data("combatant-id"));
              leaveInitiativeGroup(combatant);
            }
          };
          menuItems.push(menuLeaveGroupItem);
        }
      }

      // -----------------------------------------------------------------------
      // menu completed
      // -----------------------------------------------------------------------
      // if any menuitems have been added, add the command icon and dropdown
      if (menuItems.length > 0) {
        const combatantControlsDiv = combatantElement.getElementsByClassName('combatant-controls')[0];
        const firstChild = combatantControlsDiv.firstElementChild;
        let aCTE = document.createElement("a");
        aCTE.setAttribute('class', 'combat-tracker-extensions-menu combat-tracker-extensions-combatant-control');
        aCTE.setAttribute('id', 'combat-tracker-extensions-menu-' + combatant.id);
        aCTE.setAttribute('data-combatant-id', combatant.id);
        let iCTE = document.createElement("i");
        iCTE.setAttribute('class', 'fas fa-square-ellipsis-vertical'); //<i class="fa-sharp fa-solid fa-bars"></i>
        iCTE.setAttribute('data-tooltip', moduleTitle);
        aCTE.appendChild(iCTE);
        combatantControlsDiv.insertBefore(aCTE, firstChild);
        new DropDownMenu(combatantControlsDiv, `#combat-tracker-extensions-menu-${combatant.id}`, menuItems, dropDownMenuOptions);
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
          aCallGroup.setAttribute('data-unset-phase-index', definedPhases.phases.length - 1);
          menuItems = createAssignPhase(aCallGroup, combatTracker, i);
          phaseTitle.appendChild(aCallGroup);
        }

        phaseLi.appendChild(phaseDiv);
        let inserted = combatantOl.appendChild(phaseLi);
        if (menuItems != null) {
          new DropDownMenu(phaseLi, `#combat-tracker-extensions-menu-phase-${i}`, menuItems, dropDownMenuOptions);
        }

      }
    }
    // --------
    // CTE
    // add super tools for gms. 
    if (game.user.isGM && (OPTION_COMBAT_TRACKER_ENABLE_GROUPS || OPTION_COMBAT_TRACKER_ENABLE_BASIC_COMMANDS || OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING || (OPTION_COMBAT_TRACKER_ENABLE_PHASES && definedPhases != null))) {
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
      let menuItems = [];
      if (OPTION_COMBAT_TRACKER_ENABLE_BASIC_COMMANDS) {
        let subMenuAdd = createSelectorMenuItems(combatTracker, MENUCOMMANDS.ADD, false, false);
        let subMenuReveal = createSelectorMenuItems(combatTracker, MENUCOMMANDS.REVEAL);
        let subMenuHide = createSelectorMenuItems(combatTracker, MENUCOMMANDS.HIDE);
        let subMenuRemove = createSelectorMenuItems(combatTracker, MENUCOMMANDS.REMOVE);
        let subMenuSelect = createSelectorMenuItems(combatTracker, MENUCOMMANDS.SELECT);
        //let subMenuClearInitaitive = createSelectorMenuItems(combatTracker, MENUCOMMANDS.CLEARINITIATIVE);
        let menuItemsBasic = [
          {
            name: "COMBATTRACKEREXTENSIONS.MenuAdd",
            icon: '<img class="combat-tracker-extensions-menu-icon" src="icons/svg/combat.svg">',
            tooltip: "COMBATTRACKEREXTENSIONS.MenuAddTooltip",
            submenuitems: subMenuAdd
          },
          {separator: true},
          {
            name: "COMBATTRACKEREXTENSIONS.MenuReveal",
            icon: '<i class="fas fa-eye fa-fw"></i>',
            condition: COMBAT_ACTIVE,
            submenuitems: subMenuReveal
          },
          {
            name: "COMBATTRACKEREXTENSIONS.MenuHide",
            icon: '<i class="fas fa-eye-slash fa-fw"></i>',
            condition: COMBAT_ACTIVE,
            submenuitems: subMenuHide
          },
          {
            name: "COMBATTRACKEREXTENSIONS.MenuRemove",
            icon: '<i class="fas fa-trash fa-fw"></i>',
            condition: COMBAT_ACTIVE,
            submenuitems: subMenuRemove
          },
          {
            name: "COMBATTRACKEREXTENSIONS.MenuSelect",
            icon: '<i class="fas fa-square-dashed fa-fw"></i>',
            condition: COMBAT_ACTIVE,
            submenuitems: subMenuSelect
          }
          //,
          //{
          //  name: "COMBATTRACKEREXTENSIONS.MenuClearInitiative",
          //  icon: '<i class="fas fa-undo fa-fw"></i>',
          //  submenuitems: subMenuClearInitaitive
          //}
        ];
        menuItems = menuItems.concat(menuItemsBasic);
      }
      if (OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING && COMBAT_ACTIVE) {
        let subMenuUnMask = createSelectorMenuItems(combatTracker, MENUCOMMANDS.UNMASK);
        let subMenuMask = createSelectorMenuItems(combatTracker, MENUCOMMANDS.MASK);
        let menuMaskItems = [
          {
            name: "COMBATTRACKEREXTENSIONS.MenuUnMask",
            icon: '<i class="fas fa-glasses fa-fw"></i>',
            submenuitems: subMenuUnMask
          },
          {
            name: "COMBATTRACKEREXTENSIONS.MenuMask",
            icon: '<i class="fas fa-mask fa-fw"></i>',
            submenuitems: subMenuMask
          }
        ];
        menuItems = menuItems.concat(menuMaskItems);
      }

      if (OPTION_COMBAT_TRACKER_ENABLE_PHASES && definedPhases != null && COMBAT_ACTIVE) {
        aCTE.setAttribute('data-unset-phase-index', definedPhases.phases.length - 1);
        let subMenuUnset = createSelectorMenuItems(combatTracker, MENUCOMMANDS.ASSIGNUNSETPHASE);
        let phaseMenuItems = [
          {
            name: game.i18n.format("COMBATTRACKEREXTENSIONS.MenuUnset", {unsetphase: OPTION_COMBAT_TRACKER_PHASE_UNSET_NAME}),
            icon: '<i class="fas fa-question fa-fw"></i>',
            submenuitems: subMenuUnset
          }
        ];
        menuItems = menuItems.concat(phaseMenuItems);
      }
      if (OPTION_COMBAT_TRACKER_ENABLE_GROUPS && COMBAT_ACTIVE) {
        const combat = combatTracker.viewed;
        let submenuGroupsCreateItems = [
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateNew",
            icon: '<i class="fas fa-users-medical fa-fw"></i>',
            callback: async a => {
              let f = new GroupEditorForm();
              f.render(true, {focus: true});
            }
          },
          {separator: true},
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromPlayers",
            icon: `<i class="fas fa-users-medical fa-fw" style="color:${DISPOSITIONS.PARTY.MONO}"></i>`,
            tooltip: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromPlayersHint",
            callback: async a => {
              const combat = combatTracker.viewed;
              const groupId = DISPOSITIONS.PARTY.GROUPID;
              const groupColor = DISPOSITIONS.PARTY.MONO;
              const groupName = game.i18n.localize("COMBATTRACKEREXTENSIONS.InitiativeGroupsPlayers");
              const initiativeGroup = createInitiativeGroup(combat, groupName, groupId, groupColor);
              const combatants = combat.combatants.contents.sort((a, b) => a.name.localeCompare(b.name));
              for (const combatant of combatants) {
                if (!combatant.isNPC && combatant.token) {
                  await joinInitiativeGroup(combatant, initiativeGroup.id);
                }
              }
            }
          },
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromNPCs",
            icon: `<i class="fas fa-users-medical fa-fw" style="color:${DISPOSITIONS.NPC.MONO}"></i>`,
            tooltip: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromNPCsHint",
            callback: async a => {
              const combat = combatTracker.viewed;
              const groupId = DISPOSITIONS.NPC.GROUPID;
              const groupColor = DISPOSITIONS.NPC.MONO;
              const groupName = game.i18n.localize("COMBATTRACKEREXTENSIONS.InitiativeGroupsNPCs");
              const initiativeGroup = createInitiativeGroup(combat, groupName, groupId, groupColor);
              const combatants = combat.combatants.contents.sort((a, b) => a.name.localeCompare(b.name));
              for (const combatant of combatants) {
                if (combatant.isNPC && combatant.token) {
                  await joinInitiativeGroup(combatant, initiativeGroup.id);
                }
              }
            }
          },
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromFriendlyNPCs",
            icon: `<i class="fas fa-users-medical fa-fw" style="color:${DISPOSITIONS.FRIENDLY.MONO}"></i>`,
            tooltip: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromFriendlyNPCsHint",
            callback: async a => {
              const combat = combatTracker.viewed;
              const groupId = DISPOSITIONS.FRIENDLY.GROUPID;
              const groupColor = DISPOSITIONS.FRIENDLY.MONO;
              const groupName = game.i18n.localize("COMBATTRACKEREXTENSIONS.InitiativeGroupsFriendly");
              const initiativeGroup = createInitiativeGroup(combat, groupName, groupId, groupColor);
              const combatants = combat.combatants.contents.sort((a, b) => a.name.localeCompare(b.name));
              for (const combatant of combatants) {
                if (combatant.isNPC && combatant.token && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
                  await joinInitiativeGroup(combatant, initiativeGroup.id);
                }
              }
            }
          },
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromNeutralNPCs",
            icon: `<i class="fas fa-users-medical fa-fw" style="color:${DISPOSITIONS.NEUTRAL.MONO}"></i>`,
            tooltip: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromNeutralNPCsHint",
            callback: async a => {
              const combat = combatTracker.viewed;
              const groupId = DISPOSITIONS.NEUTRAL.GROUPID;
              const groupColor = DISPOSITIONS.NEUTRAL.MONO;
              const groupName = game.i18n.localize("COMBATTRACKEREXTENSIONS.InitiativeGroupsNeutral");
              const initiativeGroup = createInitiativeGroup(combat, groupName, groupId, groupColor);
              const combatants = combat.combatants.contents.sort((a, b) => a.name.localeCompare(b.name));
              for (const combatant of combatants) {
                if (combatant.isNPC && combatant.token && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.NEUTRAL) {
                  await joinInitiativeGroup(combatant, initiativeGroup.id);
                }
              }
            }
          },
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromHostileNPCs",
            icon: `<i class="fas fa-users-medical fa-fw" style="color:${DISPOSITIONS.HOSTILE.MONO}"></i>`,
            tooltip: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromHostileNPCsHint",
            callback: async a => {
              const combat = combatTracker.viewed;
              const groupId = DISPOSITIONS.HOSTILE.GROUPID;
              const groupColor = DISPOSITIONS.HOSTILE.MONO;
              const groupName = game.i18n.localize("COMBATTRACKEREXTENSIONS.InitiativeGroupsHostile");
              const initiativeGroup = createInitiativeGroup(combat, groupName, groupId, groupColor);
              const combatants = combat.combatants.contents.sort((a, b) => a.name.localeCompare(b.name));
              for (const combatant of combatants) {
                if (combatant.isNPC && combatant.token && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                  await joinInitiativeGroup(combatant, initiativeGroup.id);
                }
              }
            }
          },
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromSecretNPCs",
            icon: `<i class="fas fa-users-medical fa-fw" style="color:${DISPOSITIONS.SECRET.MONO}"></i>`,
            tooltip: "COMBATTRACKEREXTENSIONS.InitiativeGroupCreateFromSecretNPCsHint",
            condition: isNewerVersion(game.version, 11),
            callback: async a => {
              const combat = combatTracker.viewed;
              const groupId = DISPOSITIONS.SECRET.GROUPID;
              const groupColor = DISPOSITIONS.SECRET.MONO;
              const groupName = game.i18n.localize("COMBATTRACKEREXTENSIONS.InitiativeGroupsSecret");
              const initiativeGroup = createInitiativeGroup(combat, groupName, groupId, groupColor);
              const combatants = combat.combatants.contents.sort((a, b) => a.name.localeCompare(b.name));
              for (const combatant of combatants) {
                if (combatant.isNPC && combatant.token && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.SECRET) {
                  await joinInitiativeGroup(combatant, initiativeGroup.id);
                }
              }
            }
          }
        ];

        let submenuGroupsItems = [
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupClearAllGroups",
            icon: '<i class="fas fa-users-slash fa-fw"></i>',
            callback: async a => {
              let prompttitle = game.i18n.format("COMBATTRACKEREXTENSIONS.InitiativeGroupConfirmClearAllGroupsPromptTitle", {});
              let promptbody = '<h4>' + game.i18n.localize("AreYouSure") + '</h4>';
              promptbody += '<p>' + game.i18n.format("COMBATTRACKEREXTENSIONS.InitiativeGroupConfirmClearAllGroupsPromptBody", {}) + '</p>';
              let answer = await customDialogConfirm(prompttitle, promptbody, game.i18n.localize("Yes"), game.i18n.localize("No"));
              if (!answer) {
                return 0;
              }
              clearAllInitiativeGroups(combat);
            }
          },
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupDeleteAllGroups",
            icon: '<i class="fas fa-trash fa-fw"></i>',
            callback: async a => {
              let prompttitle = game.i18n.format("COMBATTRACKEREXTENSIONS.InitiativeGroupConfirmDeleteAllGroupsPromptTitle", {});
              let promptbody = '<h4>' + game.i18n.localize("AreYouSure") + '</h4>';
              promptbody += '<p>' + game.i18n.format("COMBATTRACKEREXTENSIONS.InitiativeGroupConfirmDeleteAllGroupsPromptBody", {}) + '</p>';
              let answer = await customDialogConfirm(prompttitle, promptbody, game.i18n.localize("Yes"), game.i18n.localize("No"));
              if (!answer) {
                return 0;
              }
              deleteAllInitiativeGroups(combat);
            }
          }
        ];

        let groupsMenuItems = createSelectorGroupsMenuItems(combatTracker, MENUCOMMANDS.EDITGROUP);
        if (groupsMenuItems.length > 0) {
          submenuGroupsItems.push({separator: true});
          submenuGroupsItems = submenuGroupsItems.concat(groupsMenuItems);
        }
        let submenuGroupsItem = [
          {separator: true},
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupsCreate",
            icon: '<i class="fas fa-users-medical fa-fw"></i>',
            submenuitems: submenuGroupsCreateItems
          },
          {
            name: "COMBATTRACKEREXTENSIONS.InitiativeGroupsEdit",
            icon: '<i class="fas fa-users fa-fw"></i>',
            submenuitems: submenuGroupsItems
          }
        ];
        menuItems = menuItems.concat(submenuGroupsItem);
      }

      // add settings
      let settingSubMenuItems = [{
          name: "COMBATTRACKEREXTENSIONS.MenuSettings",
          icon: '<i class="fas fa-cogs fa-fw"></i>',

          callback: html => {
            let f = new ModuleSettingsForm();
            f.render(true, {focus: true});
          }
        }
      ];
      if (OPTION_COMBAT_TRACKER_ENABLE_PHASES) {
        //<i class="fas fa-arrow-down-big-small fa-fw"></i>
        // <img class="combat-tracker-extensions-menu-icon" src="modules/${moduleId}/styles/img/phase.svg">
        let phaseEditorMenuItem = {
          name: "COMBATTRACKEREXTENSIONS.MenuPhaseEditor",
          icon: `<i class="fas fa-arrow-down-big-small fa-fw"></i>`,
          callback: html => {
            let f = new CombatTrackerExtensionsPhaseEditorForm();
            f.render(true, {focus: true});
          }
        };
        settingSubMenuItems.push(phaseEditorMenuItem);
      }
      if (OPTION_COMBAT_TRACKER_ENABLE_ROUNDSET) {
        let roundsetEditorMenuItem = {
          name: "COMBATTRACKEREXTENSIONS.MenuRoundSetEditor",
          icon: '<i class="fas fa-group-arrows-rotate fa-fw"></i>',
          callback: html => {
            let f = new CombatTrackerExtensionsRoundSetEditorForm();
            f.render(true, {focus: true});
          }
        };
        settingSubMenuItems.push(roundsetEditorMenuItem);
      }

      let settingMenuItem = {
        name: "COMBATTRACKEREXTENSIONS.MenuSettings",
        icon: '<i class="fas fa-cog fa-fw"></i>',
        tooltip: "COMBATTRACKEREXTENSIONS.MenuSettingsHint",
        submenuitems: settingSubMenuItems
      };
      
      menuItems.push({separator: true});
      menuItems.push(settingMenuItem);
      // should offset downvertical by 9
      dropDownMenuOptions.downVerticalAdjustment = 9;
      if (menuItems.length > 0) {
        new DropDownMenu(encounterControls, `#combat-tracker-extensions-control-menu-${combatTrackerId}`, menuItems, dropDownMenuOptions);
      }
    }
  }
});


//Hooks.on('drawToken', async (token) => {
//  console.log('drawToken', token);
//  token.document.texture.src = CONST.DEFAULT_TOKEN;
//
//});



//Hooks.on('canvasReady', async (canvas) => {
//  console.log('canvasReady');
//  const OPTION_CANVAS_TOKEN_HIDE_TOKEN_BORDER_FOR_PLAYERS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_CANVAS_TOKEN_HIDE_TOKEN_BORDER_FOR_PLAYERS.ID);
//  if (OPTION_CANVAS_TOKEN_HIDE_TOKEN_BORDER_FOR_PLAYERS) {
//    for (const token of canvas.tokens.placeables) {
//      if (OPTION_CANVAS_TOKEN_HIDE_TOKEN_BORDER_FOR_PLAYERS && !token.isOwner) {
//        const visible = token.visible;
//        token.document.texture.src = CONST.DEFAULT_TOKEN;         
//        await token.draw();
//        token.visible = visible;
//      }
//    }
//  }
//});




Hooks.on('refreshToken', async (token, options) => {
  //console.log('refreshToken', token, options);
  if (!game.user.isGM) {
    const OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS.ID);
    const OPTION_CANVAS_TOKEN_HIDE_TOKEN_BORDER_FOR_PLAYERS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_CANVAS_TOKEN_HIDE_TOKEN_BORDER_FOR_PLAYERS.ID);
    if (OPTION_CANVAS_TOKEN_HIDE_TOKEN_EFFECTS_FOR_PLAYERS && !token.isOwner) {
      token.effects.visible = false;
    }
    if (OPTION_CANVAS_TOKEN_HIDE_TOKEN_BORDER_FOR_PLAYERS && !token.isOwner) {
      token.border.visible = false;
      //token.children[4].text = game.i18n.localize("COMBATTRACKEREXTENSIONS.UnknownCombatant");          
    }
    // if you ever add an option to obscure the token name 
    // token.children[4].text = "kenneth"            
  }
});

function createAssignPhase(aCallGroup, combatTracker, phaseIndex) {

  aCallGroup.setAttribute('id', 'combat-tracker-extensions-menu-phase-' + phaseIndex);
  aCallGroup.setAttribute('data-phase-index', phaseIndex);
  aCallGroup.setAttribute('class', 'combat-tracker-extensions-menu-phase-assign');
  let iCallGroup = document.createElement('I');
  iCallGroup.setAttribute('class', 'fas fa-arrow-down-to-square');
  iCallGroup.setAttribute('data-tooltip', game.i18n.localize("COMBATTRACKEREXTENSIONS.PhaseAssign"));
  aCallGroup.appendChild(iCallGroup);

  let menuItems = [];
  let subMenuAssignPhase = createSelectorMenuItems(combatTracker, MENUCOMMANDS.ASSIGNPHASE);
  menuItems = menuItems.concat(subMenuAssignPhase);

  const OPTION_COMBAT_TRACKER_ENABLE_PHASE_ASSIGN_RANDOM_UNSET = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASE_ASSIGN_RANDOM_UNSET.ID);
  if (OPTION_COMBAT_TRACKER_ENABLE_PHASE_ASSIGN_RANDOM_UNSET) {
    let randomAssign = {
      name: game.i18n.format("COMBATTRACKEREXTENSIONS.SelectorRandomUnsetCombatant", {unsetphase: OPTION_COMBAT_TRACKER_PHASE_UNSET_NAME}),
      icon: '<i class="fas fa-dice-d20 fa-fw"></i>',
      callback: async a => {
        const unsetPhaseIndex = a.data("unset-phase-index");
        const phaseIndex = a.data("phase-index");
        // get unset phase
        // find all unset combatants
        let unsetCombatants = combatTracker.viewed.turns.filter(y => y.flags?.combattrackerextensions?.phase >= unsetPhaseIndex ?? -1);
        const OPTION_COMBAT_TRACKER_ENABLE_GROUPS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_GROUPS.ID);
        const OPTION_COMBAT_TRACKER_SHARING_GROUPS_SHARE_PHASE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHARING_GROUPS_SHARE_PHASE.ID);
        if (OPTION_COMBAT_TRACKER_ENABLE_GROUPS && OPTION_COMBAT_TRACKER_SHARING_GROUPS_SHARE_PHASE) {
          // reduce for groups with shared initiative
          const combat = combatTracker.viewed;
          let combatantsWithOutGroup = unsetCombatants.filter((v, i, a) => ((getInitiativeGroup(v) === null)));
          let combatantsWithNotSharedGroup = unsetCombatants.filter((v, i, a) => ((getInitiativeGroup(v) !== null) && getCombatInitiativeGroup(combat, getInitiativeGroup(v))?.sharesinitiative == false));
          let combatantsWithSharedGroup = unsetCombatants.filter((v, i, a) => ((getInitiativeGroup(v) !== null) && getCombatInitiativeGroup(combat, getInitiativeGroup(v))?.sharesinitiative == true));
          let combatantsWithUniqueSharedGroup = combatantsWithSharedGroup.filter((value, index, self) => {
            return self.findIndex(g => getInitiativeGroup(g) === getInitiativeGroup(value)) === index;
          });
          unsetCombatants = combatantsWithOutGroup.concat(combatantsWithUniqueSharedGroup);
          unsetCombatants = unsetCombatants.concat(combatantsWithNotSharedGroup);
        }
        //console.log(unsetCombatants)
        let combatantCount = unsetCombatants.length;
        if (combatantCount > 0) {
          let roll = await new Roll(`1d${combatantCount}`).roll({async: true});
          if (game.dice3d != null) {
            await game.dice3d.showForRoll(roll, game.user, true, null, false);
          }
          const flags = {combattrackerextensions: {phase: phaseIndex}};
          await unsetCombatants[roll.total - 1].update({flags: flags});
        }
      }
    };
    menuItems.push({separator: true});
    menuItems.push(randomAssign);
  }
  return menuItems;
}




function createSelectorMenuItems(combatTracker, command, includeGroups = true, isCombatantCommand = true) {
  let menuItems = [
    {
      name: "COMBATTRACKEREXTENSIONS.SelectorAll",
      icon: '<i class="fas fa-head-side fa-fw"></i>',
      callback: async a => {
        if (await selectorPreCommand(command, "COMBATTRACKEREXTENSIONS.SelectorAll")) {
          if (isCombatantCommand) {
            for (const combatant of combatTracker.viewed.combatants) {
              combatantCommand(a, combatant, command);
            }
          } else {
            const sceneTokens = canvas.scene.tokens;
            for (const token of sceneTokens) {
              await tokenCommand(a, token, command);
            }
          }
          selectorPostCommand(command);
        }
      }
    },

    {separator: true},
    {
      name: "COMBATTRACKEREXTENSIONS.SelectorAllPlayers",
      icon: '<i class="fas fa-head-side-brain fa-fw"></i>',
      callback: async a => {
        if (await selectorPreCommand(command, "COMBATTRACKEREXTENSIONS.SelectorAllPlayers")) {
          if (isCombatantCommand) {
            for (const combatant of combatTracker.viewed.combatants) {
              if (!combatant.isNPC) {
                combatantCommand(a, combatant, command);
              }
            }
          } else {
            const sceneTokens = canvas.scene.tokens;
            for (const token of sceneTokens) {
              if (token.hasPlayerOwner) {
                await tokenCommand(a, token, command);
              }
            }
          }
          selectorPostCommand(command);
        }
      }
    },
    {separator: true},
    {
      name: "COMBATTRACKEREXTENSIONS.SelectorAllNPCs",
      icon: '<i class="fas fa-face-meh-blank fa-fw"></i>',
      callback: async a => {
        if (await selectorPreCommand(command, "COMBATTRACKEREXTENSIONS.SelectorAllNPCs")) {
          if (isCombatantCommand) {
            for (const combatant of combatTracker.viewed.combatants) {
              if (combatant.token && combatant.isNPC) {
                combatantCommand(a, combatant, command);
              }
            }
          } else {
            const sceneTokens = canvas.scene.tokens;
            for (const token of sceneTokens) {
              if (!token.hasPlayerOwner) {
                await tokenCommand(a, token, command);
              }
            }
          }
          selectorPostCommand(command);
        }
      }
    },
    {
      name: "COMBATTRACKEREXTENSIONS.SelectorAllNPCsFriendly",
      icon: '<i class="fas fa-face-smile fa-fw"></i>',
      callback: async a => {
        if (await selectorPreCommand(command, "COMBATTRACKEREXTENSIONS.SelectorAllNPCsFriendly")) {
          if (isCombatantCommand) {
            for (const combatant of combatTracker.viewed.combatants) {
              if (combatant.isNPC && combatant.token && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
                combatantCommand(a, combatant, command);
              }
            }
          } else {
            const sceneTokens = canvas.scene.tokens;
            for (const token of sceneTokens) {
              if (!token.hasPlayerOwner && token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
                await tokenCommand(a, token, command);
              }
            }
          }
          selectorPostCommand(command);
        }
      }
    },
    {
      name: "COMBATTRACKEREXTENSIONS.SelectorAllNPCsNeutral",
      icon: '<i class="fas fa-face-meh fa-fw"></i>',
      callback: async a => {
        if (await selectorPreCommand(command, "COMBATTRACKEREXTENSIONS.SelectorAllNPCsNeutral")) {
          if (isCombatantCommand) {
            for (const combatant of combatTracker.viewed.combatants) {
              if (combatant.isNPC && combatant.token && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.NEUTRAL) {
                combatantCommand(a, combatant, command);
              }
            }
          } else {
            const sceneTokens = canvas.scene.tokens;
            for (const token of sceneTokens) {
              if (!token.hasPlayerOwner && token.disposition == CONST.TOKEN_DISPOSITIONS.NEUTRAL) {
                await tokenCommand(a, token, command);
              }
            }
          }
          selectorPostCommand(command);
        }
      }
    },
    {
      name: "COMBATTRACKEREXTENSIONS.SelectorAllNPCsHostile",
      icon: '<i class="fas fa-face-angry fa-fw"></i>',
      callback: async a => {
        if (await selectorPreCommand(command, "COMBATTRACKEREXTENSIONS.SelectorAllNPCsHostile")) {
          if (isCombatantCommand) {
            for (const combatant of combatTracker.viewed.combatants) {
              if (combatant.isNPC && combatant.token && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                combatantCommand(a, combatant, command);
              }
            }
          } else {
            const sceneTokens = canvas.scene.tokens;
            for (const token of sceneTokens) {
              if (!token.hasPlayerOwner && token.disposition == CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                await tokenCommand(a, token, command);
              }
            }
          }
          selectorPostCommand(command);
        }
      }
    },
    {
      name: "COMBATTRACKEREXTENSIONS.SelectorAllNPCsSecret",
      icon: '<i class="fas fa-face-hand-over-mouth fa-fw"></i>',
      condition: isNewerVersion(game.version, 11),
      callback: async a => {
        if (await selectorPreCommand(command, "COMBATTRACKEREXTENSIONS.SelectorAllNPCsSecret")) {
          if (isCombatantCommand) {
            for (const combatant of combatTracker.viewed.combatants) {
              if (combatant.isNPC && combatant.token && combatant.token.disposition == CONST.TOKEN_DISPOSITIONS.SECRET) {
                combatantCommand(a, combatant, command);
              }
            }
          } else {
            const sceneTokens = canvas.scene.tokens;
            for (const token of sceneTokens) {
              if (!token.hasPlayerOwner && token.disposition == CONST.TOKEN_DISPOSITIONS.SECRET) {
                await tokenCommand(a, token, command);
              }
            }
          }
          selectorPostCommand(command);
        }
      }
    }
  ];
  // groups
  const OPTION_COMBAT_TRACKER_ENABLE_GROUPS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_GROUPS.ID);
  if (OPTION_COMBAT_TRACKER_ENABLE_GROUPS && includeGroups) {
    let groupsMenuItems = createSelectorGroupsMenuItems(combatTracker, command);
    if (groupsMenuItems.length > 0) {
      menuItems.push({separator: true});
      menuItems = menuItems.concat(groupsMenuItems);
    }
  }
  return menuItems;
}

function createSelectorGroupsMenuItems(combatTracker, command) {

  let menuItems = [];
  const combat = combatTracker.viewed;
  const initiativeGroups = getInitiativeGroups(combat);
  // add all existing groups
  for (let i = 0; i < initiativeGroups.length; i++) {
    const groupId = initiativeGroups[i].id;
    const groupName = initiativeGroups[i].name;
    const groupColor = initiativeGroups[i].color;
    let tooltip = createInitiativeGroupTooltip(combat, groupId);
    let group = {
      name: `${groupName}`,
      icon: `<i class="fas fa-users fa-fw" style="color:${groupColor};"></i>`,
      tooltip: tooltip,
      callback: async a => {
        switch (command) {
          case MENUCOMMANDS.EDITGROUP:
            let f = new GroupEditorForm({groupid: groupId});
            f.render(true, {focus: true});
            break;
          default:
            if (await selectorPreCommand(command, groupName)) {
              const initiativeGroupCombatants = getInitiativeGroupCombatants(combat, groupId);
              for (let i = 0; i < initiativeGroupCombatants.length; i++) {
                combatantCommand(a, initiativeGroupCombatants[i], command);
              }
              selectorPostCommand(command);
            }

            break;
        }
      }
    };
    menuItems.push(group);
  }
  return menuItems;
}

function createInitiativeGroupTooltip(combat, groupId) {
  const OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS.ID);
  const initiativeGroupCombatants = getInitiativeGroupCombatants(combat, groupId);
  let tooltip = ``;
  for (let i = 0; i < initiativeGroupCombatants.length; i++) {
    let img = initiativeGroupCombatants[i].img;
    if (OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS && initiativeGroupCombatants[i].token) {
      img = initiativeGroupCombatants[i].token.actor.img;
    }
    tooltip += `<div class="combat-tracker-extensions-initiativegroup-tooltip"><img class="combat-tracker-extensions-initiativegroup-icon" src="${img}"><span class="combat-tracker-extensions-initiativegroup-name">${initiativeGroupCombatants[i].name}</span></div>`;
  }
  return tooltip;
}

const MENUCOMMANDS = {
  REVEAL: 1,
  HIDE: 2,
  UNMASK: 3,
  MASK: 4,
  SELECT: 5,
  CLEARINITIATIVE: 6,
  EDITGROUP: 7,
  ASSIGNPHASE: 8,
  ASSIGNUNSETPHASE: 9,
  REMOVE: 10,
  ADD: 11
};

function unselectAllTokensOnCanvas() {
  canvas.tokens.selectObjects({}, {releaseOthers: true});
}
function selectTokenOnCanvas(combatant) {
  if (combatant.token) {
    const tokenid = combatant.token.id;
    const canvasToken = canvas.tokens.ownedTokens.find(y => y.id == tokenid);
    if (canvasToken != null) {
      canvasToken.control({releaseOthers: false});
    }
  }
}

async function selectorPreCommand(command, scope = '') {
  let result = true;
  switch (command) {
    case MENUCOMMANDS.SELECT:
      unselectAllTokensOnCanvas();
      break;
    case MENUCOMMANDS.REMOVE:
      // ask user to confirm
      let prompttitle = game.i18n.format("COMBATTRACKEREXTENSIONS.ConfirmRemoveCombatantsPromptTitle", {});
      let promptbody = '<h4>' + game.i18n.localize("AreYouSure") + '</h4>';
      promptbody += '<p>' + game.i18n.format("COMBATTRACKEREXTENSIONS.ConfirmRemoveCombatantsPromptBody", {selection: game.i18n.localize(scope)}) + '</p>';
      let answer = await customDialogConfirm(prompttitle, promptbody, game.i18n.localize("Yes"), game.i18n.localize("No"));
      if (!answer) {
        result = false;
      }
      break;
  }
  return result;
}

async function selectorPostCommand(command) {
  switch (command) {
    case MENUCOMMANDS.SELECT:
      scaleToFitControlledTokens();

      break;
  }
}
async function tokenCommand(a, token, command) {
  switch (command) {
    case MENUCOMMANDS.ADD:
      //const combatTracker = game.combats.apps[0];
      let combat = game.combats.viewed;
      // check for active combat
      if (!combat) {
        // no combat started, create one
        const cls = await getDocumentClass("Combat");
        combat = await cls.create({scene: canvas.scene.id, active: true});
      }
      const c = combat.combatants.find(y => y.tokenId == token.id);
      // check if token already in this combat
      if (c == null) {
        // add this token          
        const newCombatants = [{
            tokenId: token.id,
            actorId: token.actor.id,
            sceneId: canvas.scene.id,
            initiative: null // Optional, you can set initiative here or you can leave it null to be rolled later
          }];
        await combat.createEmbeddedDocuments("Combatant", newCombatants);
      }
      break;
    default:
      break;
  }
}
async function combatantCommand(a, combatant, command) {
  let flagData;
  let phaseIndex;
  switch (command) {
    case MENUCOMMANDS.REVEAL:
      await combatant.update({hidden: false});
      break;
    case MENUCOMMANDS.HIDE:
      await combatant.update({hidden: true});
      break;
    case MENUCOMMANDS.REMOVE:
      await combatant.delete();
      break;
    case MENUCOMMANDS.SELECT:
      selectTokenOnCanvas(combatant);
      break;
    case MENUCOMMANDS.CLEARINITIATIVE:
      await combatant.update({initiative: null});
      break;
    case MENUCOMMANDS.UNMASK:
      flagData = {combattrackerextensions: {maskname: false}};
      await combatant.update({flags: flagData});
      break;
    case MENUCOMMANDS.MASK:
      flagData = {combattrackerextensions: {maskname: true}};
      await combatant.update({flags: flagData});
      break;
    case MENUCOMMANDS.ASSIGNUNSETPHASE:
      phaseIndex = a.data("unset-phase-index");
      flagData = {combattrackerextensions: {phase: phaseIndex}};
      await combatant.update({flags: flagData});
      break;
    case MENUCOMMANDS.ASSIGNPHASE:
      phaseIndex = a.data("phase-index");
      flagData = {combattrackerextensions: {phase: phaseIndex}};
      await combatant.update({flags: flagData});
      break;
    default:

      break;
  }
}

async function scaleToFitControlledTokens() {
  const boundingRect = await controlledTokensBoundary();
  if (boundingRect != null) {
    scaleToFitBoundary(boundingRect);
    // Just some markings for debugging
    const drawBoundaryMarker = false;
    if (drawBoundaryMarker) {
      drawBoundary(boundingRect);
    }
  }
}

async function scaleToFitBoundary(boundingRect = {left, top, width, height}, maxScale = 1, paddingPercent = 5){
  let scale = 0;
  let centerX = boundingRect.left + Math.round(boundingRect.width / 2);
  let centerY = boundingRect.top + Math.round(boundingRect.height / 2);
  // offsets for sidebar
  let offsetX = 0;
  if (!ui.sidebar._collapsed) {
    const sidebarMargin = 5;
    offsetX = ui.sidebar.position.width + sidebarMargin;
  }
  let offsetY = 0;
  // scaleRatioX/Y, used by themselves when boundaries are the entire scene
  const scaleRatioX = (window.innerWidth - offsetX) / (canvas.dimensions.sceneWidth);
  const scaleRatioY = (window.innerHeight - offsetY) / (canvas.dimensions.sceneHeight);
  // scaleX/Y, modifier, when bounding rect is equal to entire scene, will be 1
  const scaleX = (boundingRect.width / (canvas.dimensions.sceneWidth));
  const scaleY = (boundingRect.height / (canvas.dimensions.sceneHeight));

  const availableCanvasX = (window.innerWidth - offsetX) * scaleRatioX;
  const availableCanvasY = (window.innerHeight - offsetY) * scaleRatioY;

  const scaleFinalY = Math.round(scaleRatioY / scaleY * 2000) / 2000;
  const scaleFinalX = Math.round(scaleRatioX / scaleX * 2000) / 2000;

  // check if height and width is larger than scaled viewport
  if (boundingRect.height > availableCanvasY && boundingRect.width > availableCanvasX) {
    scale = Math.min(scaleFinalX, scaleFinalY);
  } else if (boundingRect.height > availableCanvasY) {
    scale = scaleFinalY;
  } else if (boundingRect.width > availableCanvasX) {
    scale = scaleFinalX;
  } else {
    scale = scaleFinalX;
  }

  // add padding to make the boundry slightly away from viewport boundaries
  scale = scale * (100 - paddingPercent) / 100;

  // for simplicity, constrain scale
  if (scale > maxScale)
    scale = maxScale;


  let centerOffsetX = Math.round((offsetX / scale) / 2);
  let centerOffsetY = Math.round((offsetY / scale) / 2);
  // finally pan and zoom 
  canvas.animatePan({x: centerX + centerOffsetX, y: centerY + centerOffsetY, scale: scale});
}

async function controlledTokensBoundary() {
  const tokens = canvas.tokens.controlled;
  let boundingRect;
  if (tokens.length > 0) {
    const maxX = tokens.reduce((a, b) => a.bounds.x > b.bounds.x ? a : b);
    const minX = tokens.reduce((a, b) => a.bounds.x < b.bounds.x ? a : b);
    const maxY = tokens.reduce((a, b) => a.bounds.y > b.bounds.y ? a : b);
    const minY = tokens.reduce((a, b) => a.bounds.y < b.bounds.y ? a : b);
    boundingRect = {
      left: minX.bounds.x,
      top: minY.bounds.y,
      width: (maxX.bounds.x + maxX.bounds.width) - (minX.bounds.x),
      height: (maxY.bounds.y + maxY.bounds.height) - minY.bounds.y
    };
  }
  return boundingRect;
}

async function drawBoundary(boundingRect = {left, top, width, height}){
  let centerX = boundingRect.left + Math.round(boundingRect.width / 2);
  let centerY = boundingRect.top + Math.round(boundingRect.height / 2);
  let markers = canvas.drawings.placeables.filter(y => (y.document.flags.hasOwnProperty(moduleId)));
  let deleteids = [];
  for (var i = 0; i < markers.length; i++) {
    deleteids.push(markers[i].id);
  }
  if (deleteids.length > 0) {
    await canvas.scene.deleteEmbeddedDocuments("Drawing", deleteids);
  }
  let boundryMarker = await canvas.scene.createEmbeddedDocuments('Drawing', [{x: boundingRect.left, y: boundingRect.top, shape: {width: boundingRect.width, height: boundingRect.height, type: CONST.DRAWING_TYPES.RECTANGLE}}]);
  boundryMarker[0].setFlag(moduleId, 'boundrymarker', 'frame');
  let centerMarker = await canvas.scene.createEmbeddedDocuments('Drawing', [{x: centerX - 25, y: centerY - 25, shape: {width: 50, height: 50, type: CONST.DRAWING_TYPES.ELLIPSE}}]);
  centerMarker[0].setFlag(moduleId, 'boundrymarker', 'center');
}

