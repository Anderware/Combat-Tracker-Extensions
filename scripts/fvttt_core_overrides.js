import { getModuleSetting } from "./settings-registration.js";
import { SETTINGATTRIBUTE } from "./setting-constants.js"
const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { getInitiativeGroup,getInitiativeGroupCombatants,getCombatInitiativeGroup } from "./initiative-groups.js"


// Custom sorting based on settings
export function wrappedSortCombatants(wrapped, a, b) {
  //console.log(`wrappedSortCombatants | sorting ${a.token.name}, ${b.token.name}`)
  const OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_PHASES.ID);
  const OPTION_COMBAT_TRACKER_ENABLE_GROUPS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_GROUPS.ID);
  let unsetInitiativeValue = -Infinity;
  if (OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE) {
    unsetInitiativeValue = Infinity;
  }

  const initiativeA = Number.isNumeric(a.initiative) ? a.initiative : unsetInitiativeValue;
  const initiativeB = Number.isNumeric(b.initiative) ? b.initiative : unsetInitiativeValue;
  const isNPCA = a.isNPC ?  1 : 0;
  const isNPCB = b.isNPC ?  1 : 0;
  const nameA = a?.name ?? '';
  const nameB = b?.name ?? '';
  let groupIdA='';
  let groupIdB='';
  let memberNumberA=0;
  let memberNumberB=0;
  if(OPTION_COMBAT_TRACKER_ENABLE_GROUPS){
    groupIdA = a.flags.combattrackerextensions?.initiativegroup?.id ?? '';
    groupIdB = b.flags.combattrackerextensions?.initiativegroup?.id ?? '';
    memberNumberA = a.flags.combattrackerextensions?.initiativegroup?.membernumber ?? 0;
    memberNumberB = b.flags.combattrackerextensions?.initiativegroup?.membernumber ?? 0;
  }

  if (OPTION_COMBAT_TRACKER_ENABLE_PHASES) {
    const phaseA = Number.isNumeric(a.flags.combattrackerextensions?.phase) ? a.flags.combattrackerextensions?.phase : -Infinity;
    const phaseB = Number.isNumeric(b.flags.combattrackerextensions?.phase) ? b.flags.combattrackerextensions?.phase : -Infinity;
    if (OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE) {      
      return phaseA - phaseB || initiativeA - initiativeB || groupIdA.localeCompare(groupIdB) || memberNumberA - memberNumberB || isNPCA - isNPCB || nameA.localeCompare(nameB) || a.tokenId - b.tokenId;
    } else {
      return phaseA - phaseB || initiativeB - initiativeA || groupIdA.localeCompare(groupIdB) || memberNumberA - memberNumberB || isNPCA - isNPCB || nameA.localeCompare(nameB) || a.tokenId - b.tokenId;
    }
  } else {
    if (OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE) {
      return initiativeA - initiativeB || groupIdA.localeCompare(groupIdB) || memberNumberA - memberNumberB || isNPCA - isNPCB ||  nameA.localeCompare(nameB) || a.tokenId - b.tokenId;
    } else {
      return initiativeB - initiativeA || groupIdA.localeCompare(groupIdB) || memberNumberA - memberNumberB || isNPCA - isNPCB ||  nameA.localeCompare(nameB) || a.tokenId - b.tokenId;
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
  if(combatant.actor){
    const combatantTokenIds = combatant.actor.getActiveTokens(false, true).map(t => t.id);
    return combatant.parent.combatants
          .filter(cb => combatantTokenIds.includes(cb.tokenId));
  } else {
    const result = [];
    result.push(combatant);
    return result;
  }
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


  /**
   * Roll initiative for all combatants which have not already rolled
   * @param {object} [options={}]   Additional options forwarded to the Combat.rollInitiative method
   */
  export async function wrappedRollAll(wrapped,options) {
    const ids = this.combatants.reduce((ids, c) => {
      if ( c.isOwner && (c.initiative === null) && isNotAMemberORFirstMemberOfAGroup(this,c) ) 
        ids.push(c.id);      
      return ids;
    }, []);
    return this.rollInitiative(ids, options);
  }

  /* -------------------------------------------- */

  /**
   * Roll initiative for all non-player actors who have not already rolled
   * @param {object} [options={}]   Additional options forwarded to the Combat.rollInitiative method
   */
  export async function wrappedRollNPC(wrapped,options={}) {
    const ids = this.combatants.reduce((ids, c) => {
      if ( c.isOwner && c.isNPC && (c.initiative === null) && isNotAMemberORFirstMemberOfAGroup(this,c)) 
        ids.push(c.id);      
      return ids;
    }, []);
    return this.rollInitiative(ids, options);
  }

  /* -------------------------------------------- */
  
  function isNotAMemberORFirstMemberOfAGroup(combat,combatant){
    // check if in a in a group
    const groupid = getInitiativeGroup(combatant);
    if(groupid==null){
      return true;
    }  
    const initiativeGroup = getCombatInitiativeGroup(combatant.combat, groupid);
    if (!initiativeGroup.sharesinitiative) {
      return true;
    }
    const initiativeGroupCombatants = getInitiativeGroupCombatants(combat, groupid);
    if(initiativeGroupCombatants.length<1){
      return true;
    }
    if(initiativeGroupCombatants[0].id==combatant.id){
      return true;
    }
    return false;
  }
  
  
  
  // ----------------------------------------------------------
  // the only reason for this override is a bug in v11
  // https://github.com/foundryvtt/foundryvtt/issues/9718
  // ----------------------------------------------------------
  export async function wrappedManageTurnEvents(adjustedTurn) {
    if ( !game.users.activeGM?.isSelf ) return;
    // --------------------------------------------------------------
    // EDITED
    // Original line:
    // const prior = this.combatants.get(this.previous.combatantId);
    // Fixed line:
    const prior = this.combatants.get(this.previous?.combatantId);
    // END OF EDIT
    // --------------------------------------------------------------
    
    // Adjust the turn order before proceeding. Used for embedded document workflows
    if ( Number.isNumeric(adjustedTurn) ) await this.update({turn: adjustedTurn}, {turnEvents: false});
    if ( !this.started ) return;

    // Identify what progressed
    const advanceRound = this.current.round > (this.previous.round ?? -1);
    const advanceTurn = this.current.turn > (this.previous.turn ?? -1);
    if ( !(advanceTurn || advanceRound) ) return;

    // Conclude prior turn
    if ( prior ) await this._onEndTurn(prior);

    // Conclude prior round
    if ( advanceRound && (this.previous.round !== null) ) await this._onEndRound();

    // Begin new round
    if ( advanceRound ) await this._onStartRound();

    // Begin a new turn
    await this._onStartTurn(this.combatant);
  }