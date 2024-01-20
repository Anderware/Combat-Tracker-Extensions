
import { SETTINGATTRIBUTE } from "./setting-constants.js"


export function settingsMenus(moduleId) {

}

export function settingsRegistration(moduleId) {
  // combat tracker    
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Boolean,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_NAME_MASKING.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`,
//    requiresreload: false
//  });
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_NAME_MASKED.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_NAME_MASKED.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_NAME_MASKED.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Boolean,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_NAME_MASKED.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`
//
//  });
//
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_HIDDEN.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_HIDDEN.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_HIDDEN.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Boolean,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ADD_COMBATANTS_HIDDEN.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`
//
//  });
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Boolean,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_OBSCURE_COMBATANT.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`,
//    requiresreload: false
//  });
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Boolean,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_GMS.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`,
//    requiresreload: false
//  });
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Boolean,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_SHOW_DISPOSITION_FOR_PLAYERS.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`,
//    requiresreload: false
//  });
//
//  //
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Boolean,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_REVERSE_INITIATIVE.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`,
//    requiresreload: true
//  });
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Boolean,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_DUPLICATE_COMBATANT.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`,
//    requiresreload: true
//  });
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Boolean,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_ENABLE_INITIATIVE_INPUT_FIELD.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`
//
//  });
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MIN.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MIN.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MIN.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Number,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MIN.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`
//
//  });
//  game.settings.register(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MAX.ID, {
//    name: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MAX.ID}.Name`,
//    hint: `settings.settings.${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MAX.ID}.Hint`,
//    scope: "world",
//    config: true,
//    type: Number,
//    default: `${SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_INITIATIVE_INPUT_MAX.DEFAULT}`,
//    category: `settings.categories.COMBATTRACKER_OPTIONS`
//  });


  for (const setting in SETTINGATTRIBUTE) {
    // print key and value on console
    //console.log(`${setting.ID}: ${SETTINGATTRIBUTE[setting].ID}`);
    switch (SETTINGATTRIBUTE[setting].TYPE.toUpperCase()) {
      case 'BOOLEAN':
        game.settings.register(moduleId, SETTINGATTRIBUTE[setting].ID, {
          name: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          hint: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Hint`,
          scope: SETTINGATTRIBUTE[setting].SCOPE,
          config: SETTINGATTRIBUTE[setting].CONFIG,
          type: Boolean,
          default: SETTINGATTRIBUTE[setting].DEFAULT,
          category: SETTINGATTRIBUTE[setting].CATEGORY,
          requiresreload: SETTINGATTRIBUTE[setting].REQUIRESRELOAD
        });
        break;
      case 'NUMBER':
        game.settings.register(moduleId, SETTINGATTRIBUTE[setting].ID, {
          name: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          hint: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Hint`,
          scope: SETTINGATTRIBUTE[setting].SCOPE,
          config: SETTINGATTRIBUTE[setting].CONFIG,
          type: Number,
          default: SETTINGATTRIBUTE[setting].DEFAULT,
          category: SETTINGATTRIBUTE[setting].CATEGORY,
          requiresreload: SETTINGATTRIBUTE[setting].REQUIRESRELOAD
        });
        break;
      default:

        break;
    }



  }

}

export function getModuleSetting(moduleId, settingName) {
  let setting = game.settings.get(moduleId, settingName);
  if (!setting) {
    return  '';
  } else {
    return setting;
  }
}
