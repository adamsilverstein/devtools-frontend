// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import iconStyles from './icon.css.js';

const IMAGES_URL = `${new URL('../../../Images/', import.meta.url)}`;

/**
 * @deprecated
 */
export interface IconWithName {
  iconName: string;
  color: string;
  width?: string;
  height?: string;
}

/**
 * @deprecated
 */
export type IconData = IconWithName|{
  iconPath: string,
  color: string,
  width?: string,
  height?: string,
};

/**
 * A simple icon component to display SVG icons from the `front_end/Images/` folder.
 *
 * Usage is simple:
 *
 * ```js
 * // Instantiate programmatically via the `create()` helper:
 * const icon = IconButton.Icon.create('bin');
 * const iconWithClassName = IconButton.Icon.create('bin', 'delete-icon');
 *
 * // Instantiate programmatically via the constructor:
 * const icon = new IconButton.Icon.Icon();
 * icon.name = 'bin';
 * container.appendChild(icon);
 *
 * // Use within a template:
 * LitHtml.html`
 *   <${IconButton.Icon.Icon.litTagName} name="bin">
 *   </${IconButton.Icon.Icon.litTagName}>
 * `;
 * ```
 *
 * The color for the icon defaults to `var(--icon-default)`, while the dimensions
 * default to 20px times 20px. You can change both color and size via CSS:
 *
 * ```css
 * devtools-icon.my-icon {
 *   color: red;
 *   width: 14px;
 *   height: 14px;
 * }
 * ```
 *
 * @attr name - The basename of the icon file (not including the `.svg` suffix).
 * @prop {String} name - The `"name"` attribute is reflected as property.
 * @prop {IconData} data - Deprecated way to set dimensions, color and name at once.
 */
export class Icon extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-icon`;
  static readonly observedAttributes = ['name'];

  readonly #shadowRoot;
  readonly #icon;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({mode: 'open'});
    this.#icon = document.createElement('span');
    this.#shadowRoot.appendChild(this.#icon);
  }

  /**
   * @deprecated use `name` and CSS instead.
   */
  get data(): IconData {
    return {
      color: this.style.color,
      width: this.style.width,
      height: this.style.height,
      iconName: this.name ?? '',
    };
  }

  /**
   * @deprecated use `name` and CSS instead.
   */
  set data(data: IconData) {
    const {color, width = '20px', height = '20px'} = data;
    this.style.color = color;
    this.style.width = width;
    this.style.height = height;
    if ('iconName' in data && data.iconName) {
      this.name = data.iconName;
    } else if ('iconPath' in data && data.iconPath) {
      this.name = data.iconPath;
    } else {
      throw new Error('Misconfigured `iconName` or `iconPath`.');
    }
  }

  /**
   * Yields the value of the `"name"` attribute of this `Icon` (`null` in case
   * there's no `"name"` on this element).
   */
  get name(): string|null {
    return this.getAttribute('name');
  }

  /**
   * Changes the value of the `"name"` attribute of this `Icon`. If you pass
   * `null` the `"name"` attribute will be removed from this element.
   *
   * @param name the new icon name or `null` to unset.
   */
  set name(name: string|null) {
    if (name === null) {
      this.removeAttribute('name');
    } else {
      this.setAttribute('name', name);
    }
  }

  connectedCallback(): void {
    this.#shadowRoot.adoptedStyleSheets = [iconStyles];
  }

  attributeChangedCallback(name: string, oldValue: string|null, newValue: string|null): void {
    if (oldValue === newValue) {
      return;
    }
    switch (name) {
      case 'name': {
        if (newValue === null) {
          this.#icon.style.removeProperty('--icon-url');
        } else {
          if (!newValue.endsWith('.svg')) {
            newValue = `${newValue}.svg`;
          }
          const url = new URL(newValue, IMAGES_URL);
          this.#icon.style.setProperty('--icon-url', `url(${url})`);
        }
        break;
      }
    }
  }
}

/**
 * Helper function to programmatically create an `Icon` isntance with a given
 * `name` and an optional CSS `className`.
 *
 * @param name the name of the icon to use.
 * @param className optional CSS class name(s) to put onto the element.
 * @return the newly created `Icon` instance.
 */
export const create = (name: string, className?: string): Icon => {
  const icon = new Icon();
  icon.name = name;
  if (className !== undefined) {
    icon.className = className;
  }
  return icon;
};

ComponentHelpers.CustomElements.defineComponent('devtools-icon', Icon);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-icon': Icon;
  }
}
