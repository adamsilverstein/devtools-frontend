// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import type * as SDKModule from '../../../../../front_end/core/sdk/sdk.js';
import * as Protocol from '../../../../../front_end/generated/protocol.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

describeWithMockConnection('AutofillModel', () => {
  let SDK: typeof SDKModule;
  before(async () => {
    SDK = await import('../../../../../front_end/core/sdk/sdk.js');
  });

  it('can enable and disable the Autofill CDP domain', () => {
    const target = createTarget();
    const autofillModel = target.model(SDK.AutofillModel.AutofillModel);
    const enableSpy = sinon.spy(autofillModel!.agent, 'invoke_enable');
    const disableSpy = sinon.spy(autofillModel!.agent, 'invoke_disable');
    assert.isTrue(enableSpy.notCalled);
    assert.isTrue(disableSpy.notCalled);

    autofillModel!.disable();
    assert.isTrue(enableSpy.notCalled);
    assert.isTrue(disableSpy.calledOnce);
    disableSpy.resetHistory();

    autofillModel!.enable();
    assert.isTrue(enableSpy.calledOnce);
    assert.isTrue(disableSpy.notCalled);
  });

  it('dispatches addressFormFilledEvent on autofill event', () => {
    const target = createTarget();
    const autofillModel = target.model(SDK.AutofillModel.AutofillModel);

    const dispatchedEvents: Array<SDKModule.AutofillModel.AddressFormFilledEvent> = [];
    autofillModel!.addEventListener(SDK.AutofillModel.Events.AddressFormFilled, e => dispatchedEvents.push(e.data));

    const addressFormFilledEvent: Protocol.Autofill.AddressFormFilledEvent = {
      addressUi: {
        addressFields: [
          {
            fields: [
              {name: 'NAME_FULL', value: 'Crocodile Dundee'},
            ],
          },
        ],
      },
      filledFields: [
        {
          htmlType: 'text',
          id: 'input1',
          name: '',
          value: 'Crocodile',
          autofillType: 'First name',
          fillingStrategy: Protocol.Autofill.FillingStrategy.AutofillInferred,
          fieldId: 1 as Protocol.DOM.BackendNodeId,
          frameId: '1' as Protocol.Page.FrameId,
        },
      ],
    };
    autofillModel!.addressFormFilled(addressFormFilledEvent);
    assert.lengthOf(dispatchedEvents, 1);
    assert.deepStrictEqual(dispatchedEvents[0].event, addressFormFilledEvent);
  });
});
