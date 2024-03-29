
import { SETTINGATTRIBUTE } from "./setting-constants.js"
import { CombatTrackerExtensionsPhaseEditorForm } from "./phase-editor-form.js";
import { CombatTrackerExtensionsRoundSetEditorForm } from "./roundset-editor-form.js";
import { ModuleSettingsForm } from "./module-settings-form.js";
export function settingsMenus(moduleId) {

}

export function settingsRegistration(moduleId) {
  game.settings.registerMenu(moduleId, 'OPTION_COMBAT_TRACKER_MODULE_SETTINGS_FORM', {
    name: `settings.settings.OPTION_COMBAT_TRACKER_MODULE_SETTINGS_FORM.Name`,
    label: `settings.settings.OPTION_COMBAT_TRACKER_MODULE_SETTINGS_FORM.Name`,
    hint: `settings.settings.OPTION_COMBAT_TRACKER_MODULE_SETTINGS_FORM.Hint`,
    icon: `fas fa-cog`,
    type: ModuleSettingsForm,
    restricted: true
  });
  for (const setting in SETTINGATTRIBUTE) {
    // print key and value on console
    //console.log(`${setting.ID}: ${SETTINGATTRIBUTE[setting].ID}`);
    switch (SETTINGATTRIBUTE[setting].TYPE.toUpperCase()) {
      case 'COMBATTRACKEREXTENSIONSPHASEEDITORFORM':
        game.settings.registerMenu(moduleId, SETTINGATTRIBUTE[setting].ID, {
          name: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          label: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          hint: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Hint`,
          icon: SETTINGATTRIBUTE[setting].ICON,
          type: CombatTrackerExtensionsPhaseEditorForm,
          category: SETTINGATTRIBUTE[setting].CATEGORY,
          restricted: true
        });
        break;
      case 'COMBATTRACKEREXTENSIONSROUNDSETEDITORFORM':
        game.settings.registerMenu(moduleId, SETTINGATTRIBUTE[setting].ID, {
          name: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          label: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          hint: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Hint`,
          icon: SETTINGATTRIBUTE[setting].ICON,
          type: CombatTrackerExtensionsRoundSetEditorForm,
          category: SETTINGATTRIBUTE[setting].CATEGORY,
          restricted: true
        });
        break;
      case 'BOOLEAN':
        game.settings.register(moduleId, SETTINGATTRIBUTE[setting].ID, {
          name: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          hint: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Hint`,
          scope: SETTINGATTRIBUTE[setting].SCOPE,
          config: SETTINGATTRIBUTE[setting].CONFIG,
          type: Boolean,
          default: SETTINGATTRIBUTE[setting].DEFAULT,
          category: SETTINGATTRIBUTE[setting].CATEGORY,
          requiresreload: SETTINGATTRIBUTE[setting].REQUIRESRELOAD,
          hidden : SETTINGATTRIBUTE[setting]?.HIDDEN ?? false 
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
          requiresreload: SETTINGATTRIBUTE[setting].REQUIRESRELOAD,
          hidden : SETTINGATTRIBUTE[setting]?.HIDDEN ?? false
        });
        break;
      case 'STRING':
        game.settings.register(moduleId, SETTINGATTRIBUTE[setting].ID, {
          name: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          hint: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Hint`,
          scope: SETTINGATTRIBUTE[setting].SCOPE,
          config: SETTINGATTRIBUTE[setting].CONFIG,
          type: String,
          default: SETTINGATTRIBUTE[setting].DEFAULT,
          category: SETTINGATTRIBUTE[setting].CATEGORY,
          requiresreload: SETTINGATTRIBUTE[setting].REQUIRESRELOAD,
          hidden : SETTINGATTRIBUTE[setting]?.HIDDEN ?? false
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
