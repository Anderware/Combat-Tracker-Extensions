const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { getModuleSetting } from "./settings-registration.js";
import { SETTINGATTRIBUTE } from "./setting-constants.js"
import { HTMLCOLORS } from "./html-colors.js"

export class ColorPicker extends FormApplication {
  constructor(options) {
    super();
    this.selectedColor = options?.selectedColor ?? null;
    this.callback = options?.callback ?? null;
    this.callerid = options?.id ?? null;
  }

  static initialize() {

  }

  static get defaultOptions() {
    const defaults = super.defaultOptions;
    const overrides = {
      classes: [moduleId, "color-picker"],
      width: '340',
      template: `modules/${moduleId}/templates/color-picker.hbs`,
      title: game.i18n.localize("HTMLColorPicker.Title"),
      userId: game.userId,
      closeOnSubmit: true, // do not close when submitted
      submitOnChange: false, // submit when any input changes 
      resizable: true
    };
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    return mergedOptions;
  }
  
  getData(options) {
    let data={};    
    for (let i = 0; i < HTMLCOLORS.length; i++) {
      HTMLCOLORS[i].hex=HTMLCOLORS[i].hex.toLowerCase();
      if(HTMLCOLORS[i].hex==this.selectedColor){
        HTMLCOLORS[i].selected=true;
      } else {
        HTMLCOLORS[i].selected=false;
      }
    }
    data.colors=HTMLCOLORS;
    return data;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find('.combat-tracker-extensions-color-picker-color').click(this._colorSelected.bind(this));
  }
  
  _colorSelected(event){
    event.preventDefault();
    event.stopPropagation();
    const color = event.target.getAttribute("data-color-value");
    this.callback(color,this.callerid );
    this.close();
  }
  
}

