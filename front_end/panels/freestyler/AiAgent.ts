// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../../core/host/host.js';

export enum ResponseType {
  TITLE = 'title',
  THOUGHT = 'thought',
  ACTION = 'action',
  SIDE_EFFECT = 'side-effect',
  ANSWER = 'answer',
  ERROR = 'error',
  QUERYING = 'querying',
}

export const enum ErrorType {
  UNKNOWN = 'unknown',
  ABORT = 'abort',
  MAX_STEPS = 'max-steps',
}

export interface AnswerResponse {
  type: ResponseType.ANSWER;
  text: string;
  rpcId?: number;
  suggestions?: string[];
}

export interface ErrorResponse {
  type: ResponseType.ERROR;
  error: ErrorType;
  rpcId?: number;
}

export interface TitleResponse {
  type: ResponseType.TITLE;
  title: string;
  rpcId?: number;
}

export interface ThoughtResponse {
  type: ResponseType.THOUGHT;
  thought: string;
  contextDetails?: ContextDetail[];
  rpcId?: number;
}

export interface SideEffectResponse {
  type: ResponseType.SIDE_EFFECT;
  code: string;
  confirm: (confirm: boolean) => void;
  rpcId?: number;
}

export interface ActionResponse {
  type: ResponseType.ACTION;
  code: string;
  output: string;
  canceled: boolean;
  rpcId?: number;
}

export interface QueryResponse {
  type: ResponseType.QUERYING;
}

export type ResponseData =
    AnswerResponse|ErrorResponse|ActionResponse|SideEffectResponse|ThoughtResponse|TitleResponse|QueryResponse;

export interface ContextDetail {
  title: string;
  text: string;
}

export interface AidaBuildRequestOptions {
  input: string;
}

export interface HistoryChunk {
  text: string;
  entity: Host.AidaClient.Entity;
}

export interface AidaRequestOptions {
  temperature?: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  model_id?: string;
}

type AgentOptions = {
  aidaClient: Host.AidaClient.AidaClient,
  serverSideLoggingEnabled?: boolean,
};

export abstract class AiAgent {
  readonly #sessionId: string = crypto.randomUUID();
  #aidaClient: Host.AidaClient.AidaClient;
  #serverSideLoggingEnabled: boolean;
  abstract preamble: string;
  abstract options: AidaRequestOptions;
  abstract clientFeature: Host.AidaClient.ClientFeature;
  abstract userTier: string|undefined;

  chatHistory: Map<number, HistoryChunk[]> = new Map();

  constructor(opts: AgentOptions) {
    this.#aidaClient = opts.aidaClient;
    this.#serverSideLoggingEnabled = opts.serverSideLoggingEnabled ?? false;
  }

  get historyEntry(): Array<HistoryChunk> {
    return [...this.chatHistory.values()].flat();
  }

  get chatHistoryForTesting(): Array<HistoryChunk> {
    return this.historyEntry;
  }

  async aidaFetch(
      request: Host.AidaClient.AidaRequest,
      options?: {signal?: AbortSignal},
      ): Promise<{
    response: string,
    rpcId: number|undefined,
    rawResponse: Host.AidaClient.AidaResponse|undefined,
  }> {
    let rawResponse: Host.AidaClient.AidaResponse|undefined = undefined;
    let response = '';
    let rpcId;
    for await (rawResponse of this.#aidaClient.fetch(request, options)) {
      response = rawResponse.explanation;
      rpcId = rawResponse.metadata.rpcGlobalId ?? rpcId;
      if (rawResponse.metadata.attributionMetadata?.some(
              meta => meta.attributionAction === Host.AidaClient.RecitationAction.BLOCK)) {
        throw new Error('Attribution action does not allow providing the response');
      }
    }

    return {response, rpcId, rawResponse};
  }

  buildRequest(opts: AidaBuildRequestOptions): Host.AidaClient.AidaRequest {
    const request: Host.AidaClient.AidaRequest = {
      input: opts.input,
      preamble: this.preamble,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chat_history: this.chatHistory.size ? this.historyEntry : undefined,
      client: Host.AidaClient.CLIENT_NAME,
      options: this.options,
      metadata: {
        disable_user_content_logging: !(this.#serverSideLoggingEnabled ?? false),
        string_session_id: this.#sessionId,
        user_tier: Host.AidaClient.convertToUserTierEnum(this.userTier),
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      functionality_type: Host.AidaClient.FunctionalityType.CHAT,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      client_feature: this.clientFeature,
    };
    return request;
  }

  static validTemperature(temperature: number|undefined): number|undefined {
    return typeof temperature === 'number' && temperature >= 0 ? temperature : undefined;
  }
}
