const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { getModuleSetting } from "./settings-registration.js";
import { SETTINGATTRIBUTE } from "./setting-constants.js"
export class CombatTrackerExtensionsPhaseEditorForm extends FormApplication {
  constructor(options) {
    super();
  }

  static initialize() {

  }

  static get defaultOptions() {
    const defaults = super.defaultOptions;
    const overrides = {
      classes: [moduleId, "phase-editor"],
      height: '450',
      width: '625',
      template: `modules/${moduleId}/templates/phase-editor.hbs`,
      title: moduleTitle +' ' + game.i18n.localize("PhaseEditor.Title"),
      userId: game.userId,
      closeOnSubmit: true, // do not close when submitted
      submitOnChange: false, // submit when any input changes 
      resizable: true
    };
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    return mergedOptions;
  }

  get id() {
    return `${moduleId}-phase-editor`;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('button[name="combat-tracker-extensions-phase-editor-close-editor"]').click(this._onCloseEditor.bind(this));
    html.find('button[name="combat-tracker-extensions-phase-editor-update"]').click(this._onUpdate.bind(this));
    html.find('button[name="combat-tracker-extensions-phase-editor-update-and-close"]').click(this._onUpdateAndClose.bind(this));

    this._dynamicListeners(html);
  }

  _dynamicListeners(html) {
    html.find('.combat-tracker-extensions-phase-editor-move-phase-up').click(this._moveRowUp.bind(this));
    html.find('.combat-tracker-extensions-phase-editor-move-phase-down').click(this._moveRowDown.bind(this));
    html.find('.combat-tracker-extensions-phase-editor-delete-phase').click(this._deleteRow.bind(this));
    html.find('.combat-tracker-extensions-phase-editor-icon-input').change(this._iconInputChange.bind(this));
    html.find('#combat-tracker-extensions-phase-editor-add-phase').click(this._addRow.bind(this));
  }

  getData(options) {
    let data = {};
    const OPTION_COMBAT_TRACKER_DEFINED_PHASES = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_DEFINED_PHASES.ID);
    if (OPTION_COMBAT_TRACKER_DEFINED_PHASES.length > 0) {
      let definedPhases = JSON.parse(OPTION_COMBAT_TRACKER_DEFINED_PHASES);
      if (definedPhases != null) {
        data = definedPhases;
      }
    }


    return data;
  }

  async _iconInputChange(event) {
    let thisrow = event.target.parentNode.parentNode;
    thisrow.cells[0].innerHTML = `<i class="fas ${event.target.value} combat-tracker-extensions-icon"></i>`;

  }

  async _moveRowUp(event) {
    let thisrow = event.target.parentNode.parentNode;
    let thisrowindex = thisrow.rowIndex;
    if (thisrowindex > 1) {
      // not the first row move it     
      let tbody = event.target.parentNode.parentNode.parentNode;
      let previousrow = tbody.rows[thisrowindex - 2];
      tbody.insertBefore(thisrow, previousrow);
    }
  }

  async _moveRowDown(event) {
    let thisrow = event.target.parentNode.parentNode;
    let thisrowindex = thisrow.rowIndex;
    let numberofrows = event.target.parentNode.parentNode.parentNode.rows.length;
    if (thisrowindex < numberofrows) {
      // not the last row move it      
      let tbody = event.target.parentNode.parentNode.parentNode;
      let nextrow = tbody.rows[thisrowindex + 1];
      tbody.insertBefore(thisrow, nextrow);
    }
  }

  async _deleteRow(event) {
    let thisrow = event.target.parentNode.parentNode;
    let thisrowindex = thisrow.rowIndex;
    let tbody = event.target.parentNode.parentNode.parentNode;
    tbody.deleteRow(thisrowindex - 1);
  }

  async _addRow(event) {
    let tbody = event.target.parentNode.parentNode.parentNode.parentNode.tBodies[0];
    let row = tbody.insertRow(-1);

    let tdDisplayIcon = document.createElement('td');
    row.appendChild(tdDisplayIcon);

    let tdName = document.createElement('td');
    let inputName = document.createElement("INPUT");
    inputName.setAttribute("type", "text");
    inputName.classList.add('combat-tracker-extensions-phase-editor-name-input');
    tdName.appendChild(inputName);
    row.appendChild(tdName);

    let tdIcon = document.createElement('td');
    let inputIcon = document.createElement("INPUT");
    inputIcon.setAttribute("type", "text");
    inputIcon.classList.add('combat-tracker-extensions-phase-editor-icon-input');
    inputIcon.addEventListener("change", this._iconInputChange);
    tdIcon.appendChild(inputIcon);
    row.appendChild(tdIcon);

    let tdManipulators = document.createElement('td');
    tdManipulators.className = "combat-tracker-extensions-phase-editor-cell-manipulator";
    let iMoveUp = document.createElement('I');
    iMoveUp.className = "fas fa-arrow-alt-circle-up combat-tracker-extensions-icon-btn combat-tracker-extensions-phase-editor-move-phase-up";
    iMoveUp.setAttribute('data-tooltip', game.i18n.localize("PhaseEditor.Button.MovePhaseUp.Hint"));
    iMoveUp.addEventListener("click", this._moveRowUp);

    let iMoveDown = document.createElement('I');
    iMoveDown.className = "fas fa-arrow-alt-circle-down combat-tracker-extensions-icon-btn combat-tracker-extensions-phase-editor-move-phase-down";
    iMoveDown.setAttribute('data-tooltip', game.i18n.localize("PhaseEditor.Button.MovePhaseDown.Hint"));
    iMoveDown.addEventListener("click", this._moveRowDown);

    let iDelete = document.createElement('I');
    iDelete.className = "fas fa-trash combat-tracker-extensions-icon-btn combat-tracker-extensions-phase-editor-delete-phase";
    iDelete.setAttribute('data-tooltip', game.i18n.localize("PhaseEditor.Button.DeletePhase.Hint"));
    iDelete.addEventListener("click", this._deleteRow);

    tdManipulators.appendChild(iMoveUp);
    tdManipulators.appendChild(iMoveDown);
    tdManipulators.appendChild(iDelete);
    row.appendChild(tdManipulators);
  }

  async _onUpdate(event) {
    let result='{"phases":[';
    const phaseTbody=document.getElementById('combat-tracker-extensions-phase-editor-data-tbody');
    for (let row = 0; row < phaseTbody.rows.length; row++) {
      result +=`{"name":"${phaseTbody.rows[row].cells[1].firstElementChild.value}","icon":"${phaseTbody.rows[row].cells[2].firstElementChild.value}"}`;
      if(row<phaseTbody.rows.length-1){
        result +=',';
      } 
    }
    result+=']}';
    //console.log(result);
    await game.settings.set(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_DEFINED_PHASES.ID,result); 
  }

  _onCloseEditor(event) {
    this.close();
  }

  async _onUpdateAndClose(event) {
    this._onUpdate(event);
    this._onCloseEditor(event);
  }
}
