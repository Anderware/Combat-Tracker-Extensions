/**
 * DropDownMenu
 * Version 1.0
 * 
 */

/**
 * @typedef {object} DropDownMenuEntry
 * @property {string} name               The drop down menu label. Can be localized.
 * @property {string} icon               A string containing an HTML icon element for the menu item
 * @property {function(jQuery)} callback The function to call when the menu item is clicked. Receives the HTML element
 *                                       of the entry that this drop down menu is for.
 * @property {function(jQuery):boolean} [condition] A function to call to determine if this item appears in the menu.
 *                                                  Receives the HTML element of the entry that this drop down menu is
 *                                                  for.
 */

/**
 * @callback DropDownMenuCallback
 * @param {HTMLElement} target  The element that the drop down menu has been triggered for.
 */

/**
 * Display a left-click activated DropDown Menu which provides a dropdown menu of options
 * A DropDownMenu is constructed by designating a parent HTML container and a target selector
 * An Array of menuItems defines the entries of the menu which is displayed
 *
 * Make sure that DropDownMenu global event listener is active
 * Example at init
 * Hooks.once("init", async function () {
 // DropDown menu listeners
 DropDownMenu.eventListeners();
 * 
 * Example usage
 let menuItems=[
 {
 name: "Edit",
 icon: "<i class='fas fa-edit fa-fw'></i>",
 condition:true,
 callback: html => console.log(html)
 },
 {
 name: "Copy",
 icon: "<i class='fas fa-copy fa-fw'></i>",
 condition:true,
 callback: html => console.log(html)
 },
 {
 name: "Delete",
 icon: "<i class='fas fa-trash fa-fw' style='color: rgb(255, 65, 65);'></i>",
 condition:true,
 callback: html => console.log(html)
 }
 ];  
 
 // set option eventname to click to dropdown on left click
 let dropdownOptions={
 eventName:"click",
 onOpen: null,
 onClose:null,
 customClass:"sb-context",
 downVerticalAdjustment:0,
 upVerticalAdjustment:0
 };
 new DropDownMenu(html, "#sb-btn-show-dropdown-menu", menuItems,dropdownOptions);
 new DropDownMenu(html, "#sb-btn-show-sandbox-settings", menuItems,dropdownOptions);  
 */



export class DropDownMenu {
  /**
   * @param {HTMLElement|jQuery} element                The containing HTML element within which the menu is positioned
   * @param {string} selector                           A CSS selector which activates the drop down menu.
   * @param {DropDownMenuEntry[]} menuItems              An Array of entries to display in the menu
   * @param {object} [options]                          Additional options to configure the drop down menu.
   * @param {string} [options.eventName="click"]  Optionally override the triggering event which can spawn the
   *                                                    menu
   * @param {DropDownMenuCallback} [options.onOpen]      A function to call when the drop down menu is opened.
   * @param {DropDownMenuCallback} [options.onClose]     A function to call when the drop down menu is closed.
   * @param {string} [options.customClass='']  Optionally css class to add for all dropdown elements 
   */
  constructor(element, selector, menuItems, {eventName = "click", onOpen, onClose, customClass = '',
          downVerticalAdjustment = 0, upVerticalAdjustment = 0,
          expandLeft = false,
          expandUp = false,
          expandRight = false,
          expandDown = false} = {}) {

    /**
     * The target HTMLElement being selected
     * @type {HTMLElement}
     */
    this.element = element;
    /**
     * The target CSS selector which activates the menu
     * @type {string}
     */
    this.selector = selector || element.attr("id");

    /**
     * An interaction event name which activates the menu
     * @type {string}
     */
    this.eventName = eventName;

    /**
     * The array of menu items being rendered
     * @type {DropDownMenuEntry[]}
     */
    this.menuItems = menuItems;

    /**
     * A function to call when the drop down menu is opened.
     * @type {Function}
     */
    this.onOpen = onOpen;

    /**
     * A function to call when the drop down menu is closed.
     * @type {Function}
     */
    this.onClose = onClose;

    this.customClass = customClass;
    this.downVerticalAdjustment = downVerticalAdjustment;
    this.upVerticalAdjustment = upVerticalAdjustment;

    /**
     * Track which direction the menu is expanded in
     * @type {boolean}
     */
    this._expandUp = false;
    this._expandLeft = false;

    // overides for location
    this.expandLeft = expandLeft;
    this.expandRight = expandRight;
    this.expandDown = expandDown;
    this.expandUp = expandUp;

    // Bind to the current element
    this.bind();
  }

  /**
   * The parent HTML element to which the drop down menu is attached
   * @type {HTMLElement}
   */
  #target;

  /* -------------------------------------------- */

  /**
   * A convenience accessor to the drop down menu HTML object
   * @returns {*|jQuery.fn.init|jQuery|HTMLElement}
   */
  get menu() {
    return $("#dropdown-menu");
  }

  /* -------------------------------------------- */

  /**
   * Create a DropDownMenu for this Application and dispatch hooks.
   * @param {Application} app                           The Application this DropDownMenu belongs to.
   * @param {jQuery} html                               The Application's rendered HTML.
   * @param {string} selector                           The target CSS selector which activates the menu.
   * @param {DropDownMenuEntry[]} menuItems              The array of menu items being rendered.
   * @param {object} [options]                          Additional options to configure drop down menu initialization.
   * @param {string} [options.hookName="EntryContext"]  The name of the hook to call.
   * @returns {DropDownMenu}
   */
  static create(app, html, selector, menuItems, {hookName = "EntryDropDown", ...options} = {}) {
    for (const cls of app.constructor._getInheritanceChain()) {
      /**
       * A hook event that fires when the drop down menu for entries in an Application is constructed. Substitute the
       * Application name in the hook event to target a specific Application, for example
       * "getActorDirectoryEntryDropDown".
       * @function getApplicationEntryDropDown
       * @memberof hookEvents
       * @param {jQuery} html                     The HTML element to which the drop down options are attached
       * @param {DropDownMenuEntry[]} entryOptions The drop down menu entries
       */
      console.log('dropdown create')
      Hooks.call(`get${cls.name}${hookName}`, html, menuItems);
    }

    if (menuItems)
      return new DropDownMenu(html, selector, menuItems, options);
  }

  /* -------------------------------------------- */

  /**
   * Attach a DropDownMenu instance to an HTML selector
   */
  bind() {
    const element = this.element instanceof HTMLElement ? this.element : this.element[0];
    element.addEventListener(this.eventName, event => {
      const matching = event.target.closest(this.selector);
      if (!matching)
        return;
      event.preventDefault();
      this.#target = matching;
      const menu = this.menu;

      // Remove existing dropdown UI
      const prior = document.querySelector(".dropdown");
      prior?.classList.remove("dropdown");
      if (this.#target.contains(menu[0]))
        return this.close();

      // Render a new context menu
      event.stopPropagation();
      ui.dropdown = this;
      this.onOpen?.(this.#target);
      return this.render($(this.#target));
    });
  }

  /* -------------------------------------------- */

  /**
   * Closes the menu and removes it from the DOM.
   * @param {object} [options]                Options to configure the closing behavior.
   * @param {boolean} [options.animate=true]  Animate the drop down menu closing.
   * @returns {Promise<void>}
   */
  async close( {animate = true} = {}) {
    if (animate)
      await this._animateClose(this.menu);
    this._close();
  }

  /* -------------------------------------------- */

  _close() {
    for (const item of this.menuItems) {
      delete item.element;
    }
    this.menu.remove();
    $(".dropdown").removeClass("dropdown");
    delete ui.dropdown;
    this.onClose?.(this.#target);
  }

  /* -------------------------------------------- */

  async _animateOpen(menu) {
    menu.hide();
    return new Promise(resolve => menu.slideDown(200, resolve));
  }

  /* -------------------------------------------- */

  async _animateClose(menu) {
    return new Promise(resolve => menu.slideUp(200, resolve));
  }

  /* -------------------------------------------- */

  /**
   * Render the Drop Down Menu by iterating over the menuItems it contains.
   * Check the visibility of each menu item, and only render ones which are allowed by the item's logical condition.
   * Attach a click handler to each item which is rendered.
   * @param {jQuery} target     The target element to which the drop down menu is attached
   */
  render(target) {
    const existing = $("#dropdown-menu");
    let html = existing.length ? existing : $(`<nav id="dropdown-menu" class="dropdown-menu ${this.customClass}"></nav>`);
    let ol = $(`<ol class="dropdown-items ${this.customClass}"></ol>`);
    html.html(ol);

    // Build menu items
    for (let item of this.menuItems) {

      // Determine menu item visibility (display unless false)
      let display = true;
      if (item.condition !== undefined) {
        display = (item.condition instanceof Function) ? item.condition(target) : item.condition;
      }
      if (!display)
        continue;
      let li;
      if (item.separator) {
        li = $(`<li class="dropdown-item-separator"></li>`);
      } else {
        // Construct and add the menu item
        let name = game.i18n.localize(item.name);

        let tooltip = "";
        if (item.tooltip != null) {
          tooltip = item.tooltip;
        }
        li = $(`<li class="dropdown-item ${this.customClass}" data-tooltip="${tooltip}">${item.icon}${name}</li>`);
        li.children("i").addClass("fa-fw");
      }
      ol.append(li);

      // Record a reference to the item
      item.element = li[0];
    }

    // Bail out if there are no children
    if (ol.children().length === 0)
      return;


    // Append to target
    this._setPosition(html, target);

    // Apply interactivity
    this.activateListeners(html);

    // Deactivate global tooltip
    game.tooltip.deactivate();

    // Animate open the menu
    return this._animateOpen(html);
  }

  /* -------------------------------------------- */



  /**
   * Set the position of the drop down menu, taking into consideration whether the menu should expand upward or downward
   * or left/right adjustment
   * @private
   */
  _setPosition(html, target) {
    const container = target[0].parentElement;
    // Append to target and get the dropdown bounds
    //target.css("position", "relative");
    html.css("visibility", "hidden");
    target.append(html);

    const dropdownRect = html[0].getBoundingClientRect();
    const parentRect = target[0].getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Determine whether to expand upwards
    let calculatedExpandUp = parentRect.top + dropdownRect.height + parentRect.height > window.innerHeight;
    let expandUp = false;
    if (this.expandDown) {
      expandUp = false;
    } else if (this.expandUp) {
      expandUp = true;
    } else {
      expandUp = calculatedExpandUp;
    }

    if (expandUp) {
      const bottom = window.innerHeight - parentRect.top - this.upVerticalAdjustment;
      this._expandUp = true;
      html.css("bottom", bottom + "px");
      html.css("top", "unset");
    } else {

      const top = parentRect.top + parentRect.height - this.downVerticalAdjustment;
      html.css("top", top + "px");
      html.css("bottom", "unset");
      this._expandUp = false;
    }

    html.addClass(this._expandUp ? "expand-up" : "expand-down");

    // Determine whether to show to the right or left
    let calculatedExpandLeft = parentRect.right + dropdownRect.width > window.innerWidth;
    let calculatedExpandRight = parentRect.right - dropdownRect.width < 0;
    let expandLeft = calculatedExpandLeft;
    if (this.expandRight) {
      expandLeft = false;
    } else if (this.expandLeft) {
      expandLeft = true;
    }
    // make sure it stays on screen even if the preferred is right
    if (calculatedExpandLeft && this.expandRight) {
      expandLeft = true;
    }
    if (calculatedExpandRight && this.expandLeft) {
      expandLeft = false;
    }


    if (expandLeft) {
      // shift it to the left      
      const right = window.innerWidth - parentRect.right;
      html.css("right", right + "px");
      this._expandLeft = false;
    } else {
      html.css("right", "unset");
      this._expandLeft = false;
    }
    html.addClass(this._expandLeft ? "expand-left" : "expand-right");
    // Display the menu

    html.css("visibility", "");
    target.addClass("dropdown");
  }

  /* -------------------------------------------- */

  /**
   * Local listeners which apply to each DropDownMenu instance which is created.
   * @param {jQuery} html
   */
  activateListeners(html) {
    html.on("click", "li.dropdown-item", this.#onClickItem.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle click events on drop down menu items.
   * @param {PointerEvent} event      The click event
   */
  #onClickItem(event) {
    event.preventDefault();
    event.stopPropagation();
    const li = event.currentTarget;
    const item = this.menuItems.find(i => i.element === li);
    item?.callback($(this.#target));
    this.close();
  }

  /* -------------------------------------------- */

  /**
   * Global listeners which apply once only to the document.
   */
  static eventListeners() {

    document.addEventListener("click", ev => {
      if (ui.dropdown)
        ui.dropdown.close();
    });
  }
}



