"use strict";
/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidiConnection = void 0;
const CallbackRegistry_js_1 = require("../common/CallbackRegistry.js");
const Debug_js_1 = require("../common/Debug.js");
const EventEmitter_js_1 = require("../common/EventEmitter.js");
const util_js_1 = require("../common/util.js");
const assert_js_1 = require("../util/assert.js");
const BrowsingContext_js_1 = require("./BrowsingContext.js");
const debugProtocolSend = (0, Debug_js_1.debug)('puppeteer:webDriverBiDi:SEND ►');
const debugProtocolReceive = (0, Debug_js_1.debug)('puppeteer:webDriverBiDi:RECV ◀');
/**
 * @internal
 */
class BidiConnection extends EventEmitter_js_1.EventEmitter {
    #url;
    #transport;
    #delay;
    #timeout = 0;
    #closed = false;
    #callbacks = new CallbackRegistry_js_1.CallbackRegistry();
    #browsingContexts = new Map();
    constructor(url, transport, delay = 0, timeout) {
        super();
        this.#url = url;
        this.#delay = delay;
        this.#timeout = timeout ?? 180000;
        this.#transport = transport;
        this.#transport.onmessage = this.onMessage.bind(this);
        this.#transport.onclose = this.unbind.bind(this);
    }
    get closed() {
        return this.#closed;
    }
    get url() {
        return this.#url;
    }
    send(method, params) {
        (0, assert_js_1.assert)(!this.#closed, 'Protocol error: Connection closed.');
        return this.#callbacks.create(method, this.#timeout, id => {
            const stringifiedMessage = JSON.stringify({
                id,
                method,
                params,
            });
            debugProtocolSend(stringifiedMessage);
            this.#transport.send(stringifiedMessage);
        });
    }
    /**
     * @internal
     */
    async onMessage(message) {
        if (this.#delay) {
            await new Promise(f => {
                return setTimeout(f, this.#delay);
            });
        }
        debugProtocolReceive(message);
        const object = JSON.parse(message);
        if ('type' in object) {
            switch (object.type) {
                case 'success':
                    this.#callbacks.resolve(object.id, object);
                    return;
                case 'error':
                    if (object.id === null) {
                        break;
                    }
                    this.#callbacks.reject(object.id, createProtocolError(object), object.message);
                    return;
                case 'event':
                    if (isCdpEvent(object)) {
                        BrowsingContext_js_1.cdpSessions
                            .get(object.params.session)
                            ?.emit(object.params.event, object.params.params);
                        return;
                    }
                    this.#maybeEmitOnContext(object);
                    // SAFETY: We know the method and parameter still match here.
                    this.emit(object.method, object.params);
                    return;
            }
        }
        // Even if the response in not in BiDi protocol format but `id` is provided, reject
        // the callback. This can happen if the endpoint supports CDP instead of BiDi.
        if ('id' in object) {
            this.#callbacks.reject(object.id, `Protocol Error. Message is not in BiDi protocol format: '${message}'`, object.message);
        }
        (0, util_js_1.debugError)(object);
    }
    #maybeEmitOnContext(event) {
        let context;
        // Context specific events
        if ('context' in event.params && event.params.context !== null) {
            context = this.#browsingContexts.get(event.params.context);
            // `log.entryAdded` specific context
        }
        else if ('source' in event.params &&
            event.params.source.context !== undefined) {
            context = this.#browsingContexts.get(event.params.source.context);
        }
        context?.emit(event.method, event.params);
    }
    registerBrowsingContexts(context) {
        this.#browsingContexts.set(context.id, context);
    }
    getBrowsingContext(contextId) {
        const currentContext = this.#browsingContexts.get(contextId);
        if (!currentContext) {
            throw new Error(`BrowsingContext ${contextId} does not exist.`);
        }
        return currentContext;
    }
    getTopLevelContext(contextId) {
        let currentContext = this.#browsingContexts.get(contextId);
        if (!currentContext) {
            throw new Error(`BrowsingContext ${contextId} does not exist.`);
        }
        while (currentContext.parent) {
            contextId = currentContext.parent;
            currentContext = this.#browsingContexts.get(contextId);
            if (!currentContext) {
                throw new Error(`BrowsingContext ${contextId} does not exist.`);
            }
        }
        return currentContext;
    }
    unregisterBrowsingContexts(id) {
        this.#browsingContexts.delete(id);
    }
    /**
     * Unbinds the connection, but keeps the transport open. Useful when the transport will
     * be reused by other connection e.g. with different protocol.
     * @internal
     */
    unbind() {
        if (this.#closed) {
            return;
        }
        this.#closed = true;
        // Both may still be invoked and produce errors
        this.#transport.onmessage = () => { };
        this.#transport.onclose = () => { };
        this.#browsingContexts.clear();
        this.#callbacks.clear();
    }
    /**
     * Unbinds the connection and closes the transport.
     */
    dispose() {
        this.unbind();
        this.#transport.close();
    }
}
exports.BidiConnection = BidiConnection;
/**
 * @internal
 */
function createProtocolError(object) {
    let message = `${object.error} ${object.message}`;
    if (object.stacktrace) {
        message += ` ${object.stacktrace}`;
    }
    return message;
}
function isCdpEvent(event) {
    return event.method.startsWith('cdp.');
}
//# sourceMappingURL=Connection.js.map