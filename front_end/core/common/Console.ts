// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ObjectWrapper} from './Object.js';
import {reveal} from './Revealer.js';

let consoleInstance: Console|undefined;

export class Console extends ObjectWrapper<EventTypes> {
  readonly #messagesInternal: Message[];
  /**
   * Instantiable via the instance() factory below.
   */
  constructor() {
    super();
    this.#messagesInternal = [];
  }

  static instance(opts?: {forceNew: boolean}): Console {
    if (!consoleInstance || opts?.forceNew) {
      consoleInstance = new Console();
    }

    return consoleInstance;
  }

  static removeInstance(): void {
    consoleInstance = undefined;
  }

  /**
   * Add a message to the Console panel.
   *
   * @param text the message text.
   * @param level the message level.
   * @param show whether to show the Console panel (if it's not already shown).
   * @param source the message source.
   */
  addMessage(text: string, level = MessageLevel.Info, show = false, source?: FrontendMessageSource): void {
    const message = new Message(text, level, Date.now(), show, source);
    this.#messagesInternal.push(message);
    this.dispatchEventToListeners(Events.MessageAdded, message);
  }

  log(text: string): void {
    this.addMessage(text, MessageLevel.Info);
  }

  warn(text: string, source?: FrontendMessageSource): void {
    this.addMessage(text, MessageLevel.Warning, undefined, source);
  }

  /**
   * Adds an error message to the Console panel.
   *
   * @param text the message text.
   * @param show whether to show the Console panel (if it's not already shown).
   */
  error(text: string, show = true): void {
    this.addMessage(text, MessageLevel.Error, show);
  }

  messages(): Message[] {
    return this.#messagesInternal;
  }

  show(): void {
    void this.showPromise();
  }

  showPromise(): Promise<void> {
    return reveal(this);
  }
}

export const enum Events {
  MessageAdded = 'messageAdded',
}

export type EventTypes = {
  [Events.MessageAdded]: Message,
};

export const enum MessageLevel {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export enum FrontendMessageSource {
  CSS = 'css',
  ConsoleAPI = 'console-api',
  IssuePanel = 'issue-panel',
  SelfXss = 'self-xss',
}

export class Message {
  text: string;
  level: MessageLevel;
  timestamp: number;
  show: boolean;
  source?: FrontendMessageSource;
  constructor(text: string, level: MessageLevel, timestamp: number, show: boolean, source?: FrontendMessageSource) {
    this.text = text;
    this.level = level;
    this.timestamp = (typeof timestamp === 'number') ? timestamp : Date.now();
    this.show = show;
    if (source) {
      this.source = source;
    }
  }
}
