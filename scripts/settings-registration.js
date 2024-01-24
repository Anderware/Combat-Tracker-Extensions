
import { SETTINGATTRIBUTE } from "./setting-constants.js"
import { CombatTrackerExtensionsPhaseEditorForm } from "./phase-editor-form.js";

export function settingsMenus(moduleId) {

}

export function settingsRegistration(moduleId) {
  for (const setting in SETTINGATTRIBUTE) {
    // print key and value on console
    //console.log(`${setting.ID}: ${SETTINGATTRIBUTE[setting].ID}`);
    switch (SETTINGATTRIBUTE[setting].TYPE.toUpperCase()) {
      case 'COMBATTRACKEREXTENSIONSPHASEEDITORFORM':
        game.settings.registerMenu(moduleId, SETTINGATTRIBUTE[setting].ID, {
          name:  `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          label: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          hint:  `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Hint`,
          icon:   SETTINGATTRIBUTE[setting].ICON,
          type:   CombatTrackerExtensionsPhaseEditorForm,
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
      case 'STRING':
        game.settings.register(moduleId, SETTINGATTRIBUTE[setting].ID, {
          name: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Name`,
          hint: `settings.settings.${SETTINGATTRIBUTE[setting].ID}.Hint`,
          scope: SETTINGATTRIBUTE[setting].SCOPE,
          config: SETTINGATTRIBUTE[setting].CONFIG,
          type: String,
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
