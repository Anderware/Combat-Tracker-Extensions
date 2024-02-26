const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { getModuleSetting } from "./settings-registration.js";
import { SETTINGATTRIBUTE } from "./setting-constants.js"
export class ModuleSettingsForm extends FormApplication {
  constructor(options) {
    super();
    this.moduleId = moduleId;
    this.moduleName = moduleTitle;
  }

  static initialize() {
    console.log('Initialized ModuleSettingsForm');
    Handlebars.registerHelper('modulesettings_eachProperty', function (context, options) {
      var ret = "";
      for (var prop in context)
      {
        if (context.hasOwnProperty(prop)) {
          ret = ret + options.fn({property: prop.toString(), value: context[prop]});
        }
      }
      return ret;
    });
    Handlebars.registerHelper('modulesettings_concat', function () {
      var outStr = '';
      for (var arg in arguments) {
        if (typeof arguments[arg] != 'object') {
          outStr += arguments[arg];
        }
      }
      return outStr;
    });

  }

  static get defaultOptions() {
    const defaults = super.defaultOptions;
    const overrides = {
      height: 'auto',
      template: `modules/${moduleId}/templates/module-settings-form.hbs`,
      //title: `Configure Module Settings`,
      userId: game.userId,
      closeOnSubmit: false, // do not close when submitted
      submitOnChange: false, // submit when any input changes 
      resizable: true,
      width: 600
    };
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    return mergedOptions;
  }

  get id() {
    return `module-settings-form-${moduleId}`;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('button[name="reset"]').click(this._onResetDefaults.bind(this));
    html.find('button[name="enablealloptions"]').click(this._onEnableAllOptions.bind(this));
    html.find('button[name="disablealloptions"]').click(this._onDisableAllOptions.bind(this));
    html.find('.module-settings-category-toggle').click(this._onToggleCategoryVisibility.bind(this));
    html.find('#module-settings-category-expand-all').click(this._onExpandAllCategories.bind(this));
    html.find('#module-settings-category-collapse-all').click(this._onCollapseAllCategories.bind(this));

  }

//  render(force = false, options = {}){
//    super.render(force, options = {});
//  }

  getData(options) {
    let data;
    let settings = [];
    let categories = [];
    let category = 'General';
    let setting;
    let nsetting;
    let dtype;
    let mapSettings = game.settings.settings;

    for (let k of mapSettings.keys()) {
      let isCheckbox = false;
      let isRange = false;
      let isSelect = false;
      let choices;
      let range = {"min": 0, "max": 0, "step": 1};
      let filePicker;
      let filePickerType;
      let type;
      let ignoreThisSetting = false;
      if (k.split('.')[0] == this.moduleId) {

        setting = mapSettings.get(k);

        // check for hidden
        if (setting.hasOwnProperty("hidden")) {
          if (setting.hidden == true) {
            ignoreThisSetting = true;
          }
        }
        // check for "libwrapper-dont-remind-again"
        if (k == `${moduleId}.libwrapper-dont-remind-again`) {
          ignoreThisSetting = true;
        }
        if (!ignoreThisSetting) {
          dtype = setting.type.name;
          if (setting.hasOwnProperty('category')) {
            //console.warn(setting.name + ' category:'+ setting.category);
            category = setting.category;
          } else {
            category = 'GENERAL';
          }
          switch (dtype) {
            case('Number'):
              type = 'Number';
              if (setting.hasOwnProperty("range")) {
                isRange = true;
                range.min = setting.range.min;
                range.max = setting.range.max;
                range.step = setting.range.step;
              } else {
                isRange = false;
              }
              break;
            case('Boolean'):
              type = 'Boolean';
              isCheckbox = true;
              break;
            case('String'):
              type = 'String';
              // check for choices 
              if (setting.hasOwnProperty('choices')) {
                isSelect = true;
                choices = setting.choices;
              }
              if (setting.hasOwnProperty('filePicker')) {
                filePicker = true;
                if (setting.hasOwnProperty('fileType')) {
                  filePickerType = setting.fileType;
                } else {
                  filePickerType = 'any';
                }
              }
              break;
            default:
              type = dtype;
              console.log(dtype);
          }
          nsetting = {"id": k.toString(), "type": type, "isCheckbox": isCheckbox, "isRange": isRange, "range": range, "isSelect": isSelect, "choices": choices, "filePicker": filePicker, "filePickerType": filePickerType, "name": game.i18n.localize(setting.name), "hint": game.i18n.localize(setting.hint), "value": systemsettingsform_get_game_setting(this.moduleId, setting.key)}
          settings.push(nsetting);
          if (!categories.hasOwnProperty(category)) {
            categories[category] = Array();
          }
          categories[category].push(nsetting);
        }
      }
    }

    data = {
      module_name: this.moduleName,
      settings: settings,
      categories: categories
    }
    return data;
  }

  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);
    //console.log(expandedData);
    if (expandedData.hasOwnProperty(this.moduleId)) {
      let keys = Object.keys(expandedData[this.moduleId]);
      //console.log(keys);
      let currentValue;
      let askForReload = false;
      let requiresHardRender = false;
      let requiresRender = false;
      let setting;
      for (let i = 0; i < keys.length; i++) {
        let sKey = keys[i];
        let sNewValue = expandedData[this.moduleId][keys[i]];
        //
        // get current setting
        currentValue = systemsettingsform_get_game_setting(this.moduleId, sKey);
        // check if it has changed
        if (currentValue != sNewValue) {
          // save it     
          //console.log('Saving setting ' + sKey + ':' + sNewValue + ' for system ' + this.moduleId);
          await game.settings.set(this.moduleId, sKey, sNewValue);
          // check if this setting requires reload
          setting = game.settings.settings.get(this.moduleId + "." + sKey);
          if (setting != null) {
            if (setting.hasOwnProperty('requiresreload')) {
              if (setting.requiresreload) {
                askForReload = true;
              }
            }
            if (setting.hasOwnProperty('requireshardrender')) {
              if (setting.requireshardrender) {
                requiresHardRender = true;
              }
            }
            if (setting.hasOwnProperty('requiresrender')) {
              if (setting.requiresrender) {
                requiresRender = true;
              }
            }
          }
        }
      }

      if (askForReload || requiresRender || requiresHardRender) {
        Hooks.call(`module-settings-form-${moduleId}.updateModuleSetting`, `${this.moduleId}`, {askForReload: askForReload, requiresRender: requiresRender, requiresHardRender: requiresHardRender});
      }
    }
  }

  _onResetDefaults(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const form = button.form;
    for (let [k, v] of game.settings.settings.entries()) {
      // restore only for this system         
      // v8 uses system, v9 uses namespace
      if (v.module == this.moduleId || v.namespace == this.moduleId) {
        // check if to ignore this   
        let ignoreThisSetting = false;
        if (v.hasOwnProperty("disableresetdefault")) {
          if (v.disableresetdefault == true) {
            ignoreThisSetting = true;
          }
        }
        // check for hidden
        if (v.hasOwnProperty("hidden")) {
          if (v.hidden == true) {
            ignoreThisSetting = true;
          }
        }
        // check for "libwrapper-dont-remind-again"
        if (v.key == `libwrapper-dont-remind-again`) {
          ignoreThisSetting = true;
        }
        if (!ignoreThisSetting) {
          let input = form[k];
          if (input.type === "checkbox") {
            input.checked = v.default;
          } else if (input) {
            input.value = v.default;
          }
          $(input).change();
        }
      }

    }
  }

  _onEnableAllOptions(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const form = button.form;
    this._ToggleAllOptions(form, true)
  }
  _onDisableAllOptions(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const form = button.form;
    this._ToggleAllOptions(form, false)
  }

  _ToggleAllOptions(form, enable = true) {
    for (let [k, v] of game.settings.settings.entries()) {
      // restore only for this system         
      // v8 uses module, v9 uses namespace
      if (v.module == this.moduleId || v.namespace == this.moduleId) {
        // check if to ignore this   
        let ignoreThisSetting = false;
        // check for hidden
        if (v.hasOwnProperty("hidden")) {
          if (v.hidden == true) {
            ignoreThisSetting = true;
          }
        }
        // check for "libwrapper-dont-remind-again"
        if (v.key == `libwrapper-dont-remind-again`) {
          ignoreThisSetting = true;
        }
        if (!ignoreThisSetting) {
          let input = form[k];
          if (input.type === "checkbox") {
            if (enable) {
              input.checked = true;
            } else {
              input.checked = false;
            }

          }

          $(input).change();
        }
      }

  }
  }

  _onToggleCategoryVisibility(event) {
    event.preventDefault();
    let target = event.target.getAttribute('data-target');
    if (target != null) {

      let category_settings = document.getElementById('module-settings-category-settings-' + target);
      if (category_settings != null) {
        let toggleicon = document.getElementById('module-settings-category-toggle-icon-' + target);
        if (category_settings.style.display == 'block') {
          category_settings.style.display = 'none';
          toggleicon.classList.remove("fa-minus-square");
          toggleicon.classList.add("fa-plus-square");
        } else {
          category_settings.style.display = 'block';
          toggleicon.classList.remove("fa-plus-square");
          toggleicon.classList.add("fa-minus-square");
        }
      }
      // trigger resize of window
      this.setPosition({height: 'auto', width: 600});
    }
  }
  _onExpandAllCategories(event) {
    event.preventDefault();
    this._ToggleAllcategories(true);
  }
  _onCollapseAllCategories(event) {
    event.preventDefault();
    this._ToggleAllcategories(false);

  }

  _ToggleAllcategories(expand = false) {
    // get all categories blocks
    let categoryblocks = document.getElementsByClassName('module-settings-category-settings');
    for (let i = 0; i < categoryblocks.length; i++) {
      if (expand) {
        categoryblocks[i].style.display = 'block';
      } else {
        categoryblocks[i].style.display = 'none';
      }
    }
    let toggleicons = document.getElementsByClassName('module-settings-category-toggle-icon');
    for (let i = 0; i < toggleicons.length; i++) {
      if (expand) {
        toggleicons[i].classList.remove("fa-plus-square");
        toggleicons[i].classList.add("fa-minus-square");
      } else {
        toggleicons[i].classList.remove("fa-minus-square");
        toggleicons[i].classList.add("fa-plus-square");
      }
    }


    // trigger resize of window
    this.setPosition({height: 'auto', width: 600});
  }

}
function systemsettingsform_get_game_setting(systemID, settingName) {
  let setting = null;
  try {
    setting = game.settings.get(systemID, settingName);
  } catch (err) {
    console.warn(settingName + ` is not found for system ` + systemID);
  }
  if (setting == null) {
    return  '';
  } else {
    return setting;
  }
}


Hooks.once('init', () => {
  ModuleSettingsForm.initialize();
});

Hooks.on("renderModuleSettingsForm", async (app, html, data) => {
  //console.log(`renderModuleSettingsForm`);
  let apptitle = html.find(".window-title");
  if (apptitle != null) {
    if (apptitle.length > 0) {
      const icon = `fas fa-cogs`;
      apptitle[0].innerHTML = '<i class="' + icon + '"></i> Configure Module Settings';
    }
  }
});


//Hooks.on(`module-settings-form-combat-tracker-extensions.updateModuleSetting`, async (moduleId, options) => {
//  console.log(moduleId,options);
//});