const moduleId = 'combat-tracker-extensions';
const moduleTitle = 'Combat Tracker Extensions';
import { getModuleSetting } from "./settings-registration.js";
import { SETTINGATTRIBUTE } from "./setting-constants.js"
import { ColorPicker } from "./color-picker-form.js"

import { getInitiativeGroups,
        leaveInitiativeGroup,
        deleteInitiativeGroup,
        createInitiativeGroup,
        addInitiativeGroup,
        updateInitiativeGroup,
        getInitiativeGroupCombatants,
        stringToColor} from "./initiative-groups.js"
import { customDialogConfirm } from "./custom-dialogs.js";

export class GroupEditorForm extends FormApplication {
  constructor(options) {
    super();
    this.groupid = options?.groupid ?? null;
    this.groupname = "";
    this.groupcolor = "#ff0000";
    const OPTION_COMBAT_TRACKER_NEW_GROUPS_SHARES_INITIATIVE = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_NEW_GROUPS_SHARES_INITIATIVE.ID);
    this.sharesinitiative = OPTION_COMBAT_TRACKER_NEW_GROUPS_SHARES_INITIATIVE;

    if (this.groupid == null) {
      this.groupid = foundry.utils.randomID();
      this.groupcolor = stringToColor(this.groupid);
    } else {
      const combat = game.combats.apps[0].viewed;
      const initiativeGroups = getInitiativeGroups(combat);
      if (initiativeGroups != null) {
        const initiativeGroup = initiativeGroups.find(y => y.id == this.groupid);
        if (initiativeGroup != null) {
          this.groupcolor = initiativeGroup?.color ?? '#ff0000';
          this.groupname = initiativeGroup?.name ?? '';
          this.sharesinitiative = initiativeGroup?.sharesinitiative ?? OPTION_COMBAT_TRACKER_NEW_GROUPS_SHARES_INITIATIVE;
        }
      }
    }
  }

  static initialize() {

  }

  static get defaultOptions() {
    const defaults = super.defaultOptions;
    const overrides = {
      classes: [moduleId, "group-editor"],

      width: '530',
      template: `modules/${moduleId}/templates/group-editor.hbs`,
      title: moduleTitle + ' ' + game.i18n.localize("GroupEditor.Title"),
      userId: game.userId,
      closeOnSubmit: true, // do not close when submitted
      submitOnChange: false, // submit when any input changes 
      resizable: true
    };
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    return mergedOptions;
  }

  get id() {
    return `${moduleId}-${this.groupid}-group-editor`;
  }

  getData(options) {
    const OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS = getModuleSetting(moduleId, SETTINGATTRIBUTE.OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS.ID);
    const combat = game.combats.apps[0].viewed;
    const combatants = getInitiativeGroupCombatants(combat, this.groupid);

    let members = [];
    for (let i = 0; i < combatants.length; i++) {
      let img = combatants[i].img;
      if (OPTION_COMBAT_TRACKER_USE_ACTOR_PORTRAITS_FOR_GMS) {
        img = combatants[i].token.actor.img;
      }
      members.push({id: combatants[i].id, name: combatants[i].name, img: img});
    }
    let data = {
      groupid: this.groupid,
      groupname: this.groupname,
      groupcolor: this.groupcolor,
      sharesinitiative: this.sharesinitiative,
      members: members
    };
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('button[name="combat-tracker-extensions-group-editor-close-editor"]').click(this._onCloseEditor.bind(this));
    html.find('button[name="combat-tracker-extensions-group-editor-update"]').click(this._onUpdate.bind(this));
    html.find('button[name="combat-tracker-extensions-group-editor-update-and-close"]').click(this._onUpdateAndClose.bind(this));
    html.find('button[name="combat-tracker-extensions-group-editor-delete"]').click(this._onDelete.bind(this));
    html.find('.combat-tracker-extensions-group-editor-remove-member').click(this._removeMember.bind(this));
    html.find(`#groupcolor-${this.groupid}`).change(this._onColorChange.bind(this));
    html.find('.combat-tracker-extensions-group-editor-color-button').click(this._onColorPicker.bind(this));


  }

  _pickedColor(color, id) {
    let groupColorElement = document.getElementById(`groupcolor-${id}`);
    groupColorElement.value = color;
    let groupColorPickerElement = document.getElementById(`color-picker-${id}`);
    groupColorPickerElement.setAttribute('value', color);
  }

  _onColorPicker(event) {
    let groupColorElement = document.getElementById(`groupcolor-${this.groupid}`);
    let groupColor = groupColorElement.value;
    let f = new ColorPicker({selectedColor: groupColor, callback: this._pickedColor, id: this.groupid});
    f.render(true, {focus: true});
  }

  _onColorChange(event) {
    event.preventDefault();
    event.stopPropagation();
    const backgroundColor = event.target.value;
    let groupColorElement = document.getElementById(`color-picker-${this.groupid}`);
    groupColorElement.setAttribute('value', backgroundColor);
  }
  async _removeMember(event) {
    event.preventDefault();
    event.stopPropagation();
    const combatTracker = game.combats.apps[0];
    const combatantId = event.target.getAttribute("data-combatant-id");
    const combatant = combatTracker.viewed.combatants.get(combatantId);
    await leaveInitiativeGroup(combatant);
    this.render(true);
  }

  async _onDelete(event) {
    event.preventDefault();
    event.stopPropagation();
    let prompttitle = game.i18n.format("COMBAT.InitiativeGroupConfirmDeleteGroupPromptTitle", {});
    let promptbody = '<h4>' + game.i18n.localize("AreYouSure") + '</h4>';
    promptbody += '<p>' + game.i18n.format("COMBAT.InitiativeGroupConfirmDeleteGroupPromptBody", {}) + '</p>';
    let answer = await customDialogConfirm(prompttitle, promptbody, game.i18n.localize("Yes"), game.i18n.localize("No"));
    if (!answer) {
      return 0;
    }
    const combatTracker = game.combats.apps[0];
    const combat = combatTracker.viewed;
    const combatants = combat.combatants.filter(y => (y.flags?.combattrackerextensions?.initiativegroup?.id == this.groupid));
    // remove all members
    for (var i = 0; i < combatants.length; i++) {
      leaveInitiativeGroup(combatants[i]);
    }
    // remove group    
    deleteInitiativeGroup(combat, this.groupid);
    // close editor
    this._onCloseEditor(event);
  }
  async _onUpdate(event) {
    event.preventDefault();
    event.stopPropagation();
    let groupName = document.getElementById(`groupname-${this.groupid}`).value;
    let groupColor = document.getElementById(`groupcolor-${this.groupid}`).value;
    let sharesInitiative = document.getElementById(`sharesinitiative-${this.groupid}`).checked;
    let initiativeGroup = {
      id: this.groupid,
      name: groupName,
      color: groupColor,
      sharesinitiative: sharesInitiative
    };
    const combatTracker = game.combats.apps[0];
    const combat = combatTracker.viewed;
    let initiativeGroups = getInitiativeGroups(combat);
    let initiativeGroupExists = initiativeGroups.find(y => y.id == this.groupid);
    if (initiativeGroupExists == null) {
      // add new
      addInitiativeGroup(combat, initiativeGroup);
    } else {
      // update existing
      updateInitiativeGroup(combat, initiativeGroup);
    }
  }
  _onCloseEditor(event) {
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  async _onUpdateAndClose(event) {
    event.preventDefault();
    event.stopPropagation();
    this._onUpdate(event);
    this._onCloseEditor(event);
  }
}
