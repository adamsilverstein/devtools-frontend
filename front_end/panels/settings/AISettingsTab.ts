// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Buttons from '../../ui/components/buttons/buttons.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as Input from '../../ui/components/input/input.js';
import * as LegacyWrapper from '../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as Switch from '../../ui/components/switch/switch.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';

import aiSettingsTabStyles from './aiSettingsTab.css.js';

const UIStrings = {
  /**
   *@description Header text for for a list of things to consider in the context of generative AI features
   */
  boostYourProductivity: 'Boost your productivity with AI',
  /**
   *@description Text announcing a list of facts to consider (when using a GenAI feature)
   */
  thingsToConsider: 'Things to consider',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  experimentalFeatures:
      'These features are experimental. They use generative AI and may provide inaccurate or offensive information that doesn’t represent Google’s views.',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  sendsDataToGoogle:
      'These features send relevant data to Google. Google collects this data and feedback to improve its products and services with the help of human reviewers. Avoid sharing sensitive or personal information.',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  retainData:
      'Usage data will be retained for up to 18 months and stored in such a way that Google can’t tell who provided it.',
  /**
   *@description Text describing a fact to consider when using AI features
   */
  adminSettings:
      'Depending on your Google account management and/or region, Google may refrain from data collection. Depending on your organization’s settings, features available to managed users may vary.',
  /**
   *@description Text describing the 'Console Insights' feature
   */
  helpUnderstandConsole: 'Helps you understand and fix console warnings and errors',
  /**
   *@description Label for a button to expand an accordion
   */
  showMore: 'Show more',
  /**
   *@description Label for a button to collapse an accordion
   */
  showLess: 'Show less',
  /**
   *@description Header for a list of feature attributes. 'When (the feature is turned) on, you'll be able to ...'
   */
  whenOn: 'When on',
  /**
   *@description Description of the console insights feature
   */
  explainConsole: 'Get explanations for console warnings and errors',
  /**
   *@description Description of the console insights feature ('these issues' refers to console warnings and errors)
   */
  receiveSuggestions: 'Receive suggestions and code samples to address these issues',
  /**
   *@description Explainer for which data is being sent by the console insights feature
   */
  consoleInsightsSendsData:
      'The console message, associated stack trace, related source code, and the associated network headers are sent to Google to generate explanations. This data may be seen by human reviewers to improve this feature.',
  /**
   *@description Reference to the terms of service and privacy notice
   *@example {Google Terms of Service} PH1
   *@example {Privacy Notice} PH2
   */
  termsOfServicePrivacyNotice: 'Use of these features is subject to the {PH1} and {PH2}',
  /**
   *@description Text describing the 'AI assistance' feature
   */
  helpUnderstandStyling: 'Get help with understanding CSS styles',
  /**
   *@description Text which is a hyperlink to more documentation
   */
  learnMore: 'Learn more',
  /**
   *@description Description of the AI assistance feature
   */
  explainStyling: 'Understand CSS styles with AI-powered insights',
  /**
   *@description Description of the AI assistance feature
   */
  receiveStylingSuggestions: 'Improve your development workflow with contextual explanations and suggestions',
  /**
   *@description Explainer for which data is being sent by the AI assistance feature
   */
  freestylerSendsData:
      'Any data the inspected page can access via Web APIs, network requests, files, and performance traces are sent to Google to generate explanations. This data may be seen by human reviewers to improve this feature. Don’t use on pages with personal or sensitive information.',
  /**
   *@description Label for a link to the terms of service
   */
  termsOfService: 'Google Terms of Service',
  /**
   *@description Label for a link to the privacy notice
   */
  privacyNotice: 'Google Privacy Policy',
  /**
   *@description Header for the AI innovations settings page
   */
  aiInnovations: 'AI innovations',
  /**
   *@description Label for a toggle to enable the Console Insights feature
   */
  enableConsoleInsights: 'Enable `Console insights`',
  /**
   *@description Label for a toggle to enable the AI assistance feature
   */
  enableAiAssistance: 'Enable AI assistance',
};
const str_ = i18n.i18n.registerUIStrings('panels/settings/AISettingsTab.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const chevronDownIconUrl = new URL('../../Images/chevron-down.svg', import.meta.url).toString();
const chevronUpIconUrl = new URL('../../Images/chevron-up.svg', import.meta.url).toString();

export class AISettingsTab extends LegacyWrapper.LegacyWrapper.WrappableComponent {
  static readonly litTagName = LitHtml.literal`devtools-settings-ai-settings-tab`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #consoleInsightsSetting?: Common.Settings.Setting<boolean>;
  #aiAssistanceSetting?: Common.Settings.Setting<boolean>;
  #isConsoleInsightsSettingExpanded = false;
  #isAiAssistanceSettingExpanded = false;

  constructor() {
    super();
    try {
      this.#consoleInsightsSetting = Common.Settings.Settings.instance().moduleSetting('console-insights-enabled');
    } catch {
      this.#consoleInsightsSetting = undefined;
    }
    try {
      this.#aiAssistanceSetting = Common.Settings.Settings.instance().moduleSetting('ai-assistance-enabled');
    } catch {
      this.#aiAssistanceSetting = undefined;
    }
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [Input.checkboxStyles, aiSettingsTabStyles];
  }

  #expandConsoleInsightsSetting(): void {
    this.#isConsoleInsightsSettingExpanded = !this.#isConsoleInsightsSettingExpanded;
    void this.render();
  }

  #toggleConsoleInsightsSetting(ev: Event): void {
    // If the switch is being clicked, there is both a click- and a
    // change-event. Aborting on click avoids running this method twice.
    if (ev.target instanceof Switch.Switch.Switch && ev.type !== Switch.Switch.SwitchChangeEvent.eventName) {
      return;
    }
    if (!this.#consoleInsightsSetting) {
      return;
    }
    const oldSettingValue = this.#consoleInsightsSetting.get();
    this.#consoleInsightsSetting.set(!oldSettingValue);
    if (!oldSettingValue && !this.#isConsoleInsightsSettingExpanded) {
      this.#isConsoleInsightsSettingExpanded = true;
    }
    if (oldSettingValue === false) {
      // Allows skipping the consent reminder if the user enabled the feature via settings in the current session
      Common.Settings.Settings.instance()
          .createSetting('console-insights-skip-reminder', true, Common.Settings.SettingStorageType.SESSION)
          .set(true);
    }
    void this.render();
  }

  #expandAiAssistanceSetting(): void {
    this.#isAiAssistanceSettingExpanded = !this.#isAiAssistanceSettingExpanded;
    void this.render();
  }

  #toggleAiAssistanceSetting(ev: Event): void {
    // If the switch is being clicked, there is both a click- and a
    // change-event. Aborting on click avoids running this method twice.
    if (ev.target instanceof Switch.Switch.Switch && ev.type !== Switch.Switch.SwitchChangeEvent.eventName) {
      return;
    }
    if (!this.#aiAssistanceSetting) {
      return;
    }
    const oldSettingValue = this.#aiAssistanceSetting.get();
    this.#aiAssistanceSetting.set(!oldSettingValue);
    if (!oldSettingValue && !this.#isAiAssistanceSettingExpanded) {
      this.#isAiAssistanceSettingExpanded = true;
    }
    void this.render();
  }

  #renderSharedDisclaimerItem(icon: string, text: Common.UIString.LocalizedString|LitHtml.TemplateResult):
      LitHtml.TemplateResult {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      <div>
        <${IconButton.Icon.Icon.litTagName} .data=${{
          iconName: icon,
          color: 'var(--icon-default)',
          width: 'var(--sys-size-8)',
          height: 'var(--sys-size-8)',
        } as IconButton.Icon.IconData}>
        </${IconButton.Icon.Icon.litTagName}>
      </div>
      <div>${text}</div>
    `;
    // clang-format on
  }

  #renderSharedDisclaimer(): LitHtml.TemplateResult {
    const tosLink = UI.XLink.XLink.create(
        'https://policies.google.com/terms', i18nString(UIStrings.termsOfService), undefined, undefined,
        'terms-of-service');
    const privacyNoticeLink = UI.XLink.XLink.create(
        'https://policies.google.com/privacy', i18nString(UIStrings.privacyNotice), undefined, undefined,
        'privacy-notice');

    const bulletPoints = [
      {icon: 'psychiatry', text: i18nString(UIStrings.experimentalFeatures)},
      {icon: 'google', text: i18nString(UIStrings.sendsDataToGoogle)},
      {icon: 'calendar-today', text: i18nString(UIStrings.retainData)},
      {icon: 'corporate-fare', text: i18nString(UIStrings.adminSettings)},
      {
        icon: 'policy',
        text: LitHtml.html`${i18n.i18n.getFormatLocalizedString(str_, UIStrings.termsOfServicePrivacyNotice, {
          PH1: tosLink,
          PH2: privacyNoticeLink,
        })}`,
      },
    ];
    return LitHtml.html`
      <div class="shared-disclaimer">
        <h2>${i18nString(UIStrings.boostYourProductivity)}</h2>
        <h3 class="disclaimer-list-header">${i18nString(UIStrings.thingsToConsider)}</h3>
        <div class="disclaimer-list">
          ${bulletPoints.map(item => this.#renderSharedDisclaimerItem(item.icon, item.text))}
        </div>
      </div>
    `;
  }

  #renderSettingItem(icon: string, text: Common.UIString.LocalizedString): LitHtml.TemplateResult {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      <div>
        <${IconButton.Icon.Icon.litTagName} .data=${{
          iconName: icon,
          width: 'var(--sys-size-9)',
          height: 'var(--sys-size-9)',
        } as IconButton.Icon.IconData}>
        </${IconButton.Icon.Icon.litTagName}>
      </div>
      <div class="padded">${text}</div>
    `;
    // clang-format on
  }

  #renderConsoleInsightsSetting(): LitHtml.TemplateResult {
    const detailsClasses = {
      'whole-row': true,
      open: this.#isConsoleInsightsSettingExpanded,
    };
    const tabindex = this.#isConsoleInsightsSettingExpanded ? '0' : '-1';

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      <div class="accordion-header" @click=${this.#expandConsoleInsightsSetting}>
        <div class="icon-container centered">
          <${IconButton.Icon.Icon.litTagName} name="lightbulb-spark"></${IconButton.Icon.Icon.litTagName}>
        </div>
        <div class="setting-card">
          <h2>${i18n.i18n.lockedString('Console Insights')}</h2>
          <div class="setting-description">${i18nString(UIStrings.helpUnderstandConsole)}</div>
        </div>
        <div class="dropdown centered">
          <${Buttons.Button.Button.litTagName}
            .data=${{
              title: this.#isConsoleInsightsSettingExpanded ? i18nString(UIStrings.showLess) : i18nString(UIStrings.showMore),
              size: Buttons.Button.Size.SMALL,
              iconUrl: this.#isConsoleInsightsSettingExpanded ? chevronUpIconUrl : chevronDownIconUrl,
              variant: Buttons.Button.Variant.ICON,
              jslogContext: 'console-insights.accordion',
            } as Buttons.Button.ButtonData}
          ></${Buttons.Button.Button.litTagName}>
        </div>
      </div>
      <div class="divider"></div>
      <div class="toggle-container centered"
        title=${this.#consoleInsightsSetting?.disabledReason()}
        @click=${this.#toggleConsoleInsightsSetting.bind(this)}
      >
        <${Switch.Switch.Switch.litTagName}
          .checked=${this.#consoleInsightsSetting?.get() && !this.#consoleInsightsSetting?.disabled()}
          .jslogContext=${this.#consoleInsightsSetting?.name}
          .disabled=${this.#consoleInsightsSetting?.disabled()}
          @switchchange=${this.#toggleConsoleInsightsSetting.bind(this)}
          aria-label=${this.#consoleInsightsSetting?.disabledReason() || i18nString(UIStrings.enableConsoleInsights)}
        ></${Switch.Switch.Switch.litTagName}>
      </div>
      <div class=${LitHtml.Directives.classMap(detailsClasses)}>
        <div class="overflow-hidden">
          <div class="expansion-grid">
            <h3 class="expansion-grid-whole-row">${i18nString(UIStrings.whenOn)}</h3>
            ${this.#renderSettingItem('lightbulb', i18nString(UIStrings.explainConsole))}
            ${this.#renderSettingItem('code', i18nString(UIStrings.receiveSuggestions))}
            <h3 class="expansion-grid-whole-row">${i18nString(UIStrings.thingsToConsider)}</h3>
            ${this.#renderSettingItem('google', i18nString(UIStrings.consoleInsightsSendsData))}
            <div class="expansion-grid-whole-row">
              <x-link
                href="https://goo.gle/devtools-console-messages-ai"
                class="link"
                tabindex=${tabindex}
                jslog=${VisualLogging.link('learn-more.console-insights').track({
                  click: true,
                })}
              >${i18nString(UIStrings.learnMore)}</x-link>
            </div>
          </div>
        </div>
      </div>
    `;
    // clang-format on
  }

  #renderAiAssistanceSetting(): LitHtml.TemplateResult {
    const detailsClasses = {
      'whole-row': true,
      open: this.#isAiAssistanceSettingExpanded,
    };
    const tabindex = this.#isAiAssistanceSettingExpanded ? '0' : '-1';

    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    return LitHtml.html`
      <div class="accordion-header" @click=${this.#expandAiAssistanceSetting}>
        <div class="icon-container centered">
          <${IconButton.Icon.Icon.litTagName} name="smart-assistant"></${IconButton.Icon.Icon.litTagName}>
        </div>
        <div class="setting-card">
          <h2>${i18n.i18n.lockedString('AI assistance')}</h2>
          <div class="setting-description">${i18nString(UIStrings.helpUnderstandStyling)}</div>
        </div>
        <div class="dropdown centered">
          <${Buttons.Button.Button.litTagName}
            .data=${{
              title: this.#isAiAssistanceSettingExpanded ? i18nString(UIStrings.showLess) : i18nString(UIStrings.showMore),
              size: Buttons.Button.Size.SMALL,
              iconUrl: this.#isAiAssistanceSettingExpanded ? chevronUpIconUrl : chevronDownIconUrl,
              variant: Buttons.Button.Variant.ICON,
              jslogContext: 'freestyler.accordion',
            } as Buttons.Button.ButtonData}
          ></${Buttons.Button.Button.litTagName}>
        </div>
      </div>
      <div class="divider"></div>
      <div class="toggle-container centered"
        title=${this.#aiAssistanceSetting?.disabledReason()}
        @click=${this.#toggleAiAssistanceSetting.bind(this)}
      >
        <${Switch.Switch.Switch.litTagName}
          .checked=${this.#aiAssistanceSetting?.get() && !this.#aiAssistanceSetting?.disabled()}
          .jslogContext=${this.#aiAssistanceSetting?.name}
          .disabled=${this.#aiAssistanceSetting?.disabled()}
          @switchchange=${this.#toggleAiAssistanceSetting.bind(this)}
          aria-label=${this.#aiAssistanceSetting?.disabledReason() || i18nString(UIStrings.enableAiAssistance)}
        ></${Switch.Switch.Switch.litTagName}>
      </div>
      <div class=${LitHtml.Directives.classMap(detailsClasses)}>
        <div class="overflow-hidden">
          <div class="expansion-grid">
            <h3 class="expansion-grid-whole-row">${i18nString(UIStrings.whenOn)}</h3>
            ${this.#renderSettingItem('info', i18nString(UIStrings.explainStyling))}
            ${this.#renderSettingItem('pen-spark', i18nString(UIStrings.receiveStylingSuggestions))}
            <h3 class="expansion-grid-whole-row">${i18nString(UIStrings.thingsToConsider)}</h3>
            ${this.#renderSettingItem('google', i18nString(UIStrings.freestylerSendsData))}
            <div class="expansion-grid-whole-row">
              <x-link
                href="https://goo.gle/devtools-ai-assistance"
                class="link"
                tabindex=${tabindex}
                jslog=${VisualLogging.link('learn-more.ai-assistance').track({
                  click: true,
                })}
              >${i18nString(UIStrings.learnMore)}</x-link>
            </div>
          </div>
        </div>
      </div>
    `;
    // clang-format on
  }

  override async render(): Promise<void> {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      <header>
        <h1>${i18nString(UIStrings.aiInnovations)}</h1>
      </header>
      <div class="settings-container-wrapper" jslog=${VisualLogging.pane('chrome-ai')}>
        ${this.#renderSharedDisclaimer()}
        ${this.#consoleInsightsSetting || this.#aiAssistanceSetting ? LitHtml.html`
          <div class="settings-container">
            ${this.#consoleInsightsSetting ? this.#renderConsoleInsightsSetting() : LitHtml.nothing}
            ${this.#aiAssistanceSetting ? this.#renderAiAssistanceSetting() : LitHtml.nothing}
          </div>
        ` : LitHtml.nothing}
      </div>
    `, this.#shadow, {host: this});
    // clang-format on
  }
}

customElements.define('devtools-settings-ai-settings-tab', AISettingsTab);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-settings-ai-settings-tab': AISettingsTab;
  }
}
