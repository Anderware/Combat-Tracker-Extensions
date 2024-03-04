const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { getModuleSetting } from "./settings-registration.js";
import { SETTINGATTRIBUTE } from "./setting-constants.js"
       

function sortGroupCombatants(a, b) {
  return a.flags?.combattrackerextensions?.initiativegroup?.membernumber - b.flags?.combattrackerextensions?.initiativegroup?.membernumber || a.name.localeCompare(b.name);
}

// returns array with combatants
export function getInitiativeGroupCombatants(combat, groupid) {
  // get all members
  let combatants = combat.combatants.filter(y => (y.flags?.combattrackerextensions?.initiativegroup?.id == groupid));
  // sort them by adding sequence
  //combatants.sort((a, b) => a.flags?.combattrackerextensions?.initiativegroup?.membernumber - b.flags?.combattrackerextensions?.initiativegroup?.membernumber);  
  combatants.sort(sortGroupCombatants);
  return combatants;
}

export async function clearAllInitiativeGroups(combat) {
  const initiativeGroups = getInitiativeGroups(combat);
  for (let i = 0; i < initiativeGroups.length; i++) {
    const groupId = initiativeGroups[i].id;
    const initiativeGroupCombatants = getInitiativeGroupCombatants(combat, groupId);
    for (let j = 0; j < initiativeGroupCombatants.length; j++) {
      leaveInitiativeGroup(initiativeGroupCombatants[j]);
    }
  }
}

export async function deleteAllInitiativeGroups(combat) {
  clearAllInitiativeGroups(combat);
  const flags = {combattrackerextensions: {initiativegroups: null}};
  await combat.update({flags: flags});
}

// returns array. empty if no groups found
export function getInitiativeGroups(combat) {
  let data = [];
  if (combat != null) {
    const initiativeGroups = combat.flags?.combattrackerextensions?.initiativegroups ?? null;
    if (initiativeGroups != null) {
      return initiativeGroups;
    }
  }
  return data;
}

export function getCombatInitiativeGroup(combat, groupid) {
  let initiativeGroups = getInitiativeGroups(combat);
  let initiativeGroup = initiativeGroups.find(y => y.id == groupid);
  return initiativeGroup;
}

export async function addInitiativeGroup(combat, initiativeGroup) {
  let initiativeGroups = getInitiativeGroups(combat);
  initiativeGroups.push(initiativeGroup);
  const flags = {combattrackerextensions: {initiativegroups: initiativeGroups}};
  await combat.update({flags: flags});
}

export async function updateInitiativeGroup(combat, initiativeGroup) {
  let initiativeGroups = getInitiativeGroups(combat);
  let initiativeGroupsToKeep = initiativeGroups.filter(y => y.id != initiativeGroup.id);
  initiativeGroupsToKeep.push(initiativeGroup);
  const flags = {combattrackerextensions: {initiativegroups: initiativeGroupsToKeep}};
  await combat.update({flags: flags});
}

export async function deleteInitiativeGroup(combat, groupid) {
  let initiativeGroups = getInitiativeGroups(combat);
  let initiativeGroupsToKeep = initiativeGroups.filter(y => y.id != groupid);
  const flags = {combattrackerextensions: {initiativegroups: initiativeGroupsToKeep}};
  await combat.update({flags: flags});
}


export function createInitiativeGroup(combat, groupName, id = null, color = null) {
  const OPTION_COMBAT_TRACKER_NEW_GROUPS_SHARES_INITIATIVE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_NEW_GROUPS_SHARES_INITIATIVE.ID);
  let groupId;
  if (id == null) {
    groupId = foundry.utils.randomID();
  } else {
    groupId = id;
  }
  let groupColor;
  if (color == null) {
    groupColor = stringToColor(groupId);
  } else {
    groupColor = color;
  }
  let initiativeGroup = {
    id: groupId,
    name: groupName,
    color: groupColor,
    sharesinitiative: OPTION_COMBAT_TRACKER_NEW_GROUPS_SHARES_INITIATIVE
  };
  let initiativeGroups = getInitiativeGroups(combat);
  let initiativeGroupExists = initiativeGroups.find(y => y.id == groupId);
  if (initiativeGroupExists == null) {
    // add new
    addInitiativeGroup(combat, initiativeGroup);
  } else {
    // update existing
    updateInitiativeGroup(combat, initiativeGroup);
  }

  return initiativeGroup;
}


// returns id of combatant initative group. null if no group assigned
export function getInitiativeGroup(combatant) {
  return combatant.flags?.combattrackerextensions?.initiativegroup?.id ?? null;
}

export async function joinInitiativeGroup(combatant, groupId) {
  const initiativeGroupCombatants = getInitiativeGroupCombatants(combatant.combat, groupId);
  const memberNumber = initiativeGroupCombatants.length;
  const flags = {combattrackerextensions: {initiativegroup: {id: groupId, membernumber: memberNumber}}};
  await combatant.update({flags: flags});
}

export async function leadInitiativeGroup(combatant, groupId) {
  const initiativeGroupCombatants = getInitiativeGroupCombatants(combatant.combat, groupId);
  for (var i = 0; i < initiativeGroupCombatants.length; i++) {    
    const flags = {combattrackerextensions: {initiativegroup: {id: groupId, membernumber: i + 1}}};
    initiativeGroupCombatants[i].update({flags: flags})
  }
  const flags = {combattrackerextensions: {initiativegroup: {id: groupId, membernumber: 0}}};
  await combatant.update({flags: flags})
}

export async function leaveInitiativeGroup(combatant) {
  const flags = {combattrackerextensions: {initiativegroup: null}};
  await combatant.update({flags: flags});
}


export function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}