import {
  ChannelUpdate,
  IMessagingService,
  InboundChannelUpdateError,
  LockError,
  LockInformation,
  MessagingError,
  OutboundChannelUpdateError,
  Result,
  FullChannelState,
  EngineError,
  FullTransferState,
  EngineParams,
  IsAliveError,
  IsAliveInfo,
  IsAliveResponse,
} from "@connext/vector-types";
import { Evt } from "evt";

import { getRandomBytes32 } from "../../hexStrings";

export class MemoryMessagingService implements IMessagingService {
  private readonly evt: Evt<{
    to?: string;
    from: string;
    inbox?: string;
    replyTo?: string;
    data: {
      update?: ChannelUpdate<any>;
      previousUpdate?: ChannelUpdate<any>;
      error?: InboundChannelUpdateError;
    };
  }> = Evt.create<{
    to?: string;
    from: string;
    inbox?: string;
    data: { update?: ChannelUpdate<any>; previousUpdate?: ChannelUpdate<any>; error?: InboundChannelUpdateError };
    replyTo?: string;
  }>();

  flush(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async connect(): Promise<void> {
    return;
  }

  async disconnect(): Promise<void> {
    this.evt.detach();
  }

  async sendProtocolMessage(
    channelUpdate: ChannelUpdate<any>,
    previousUpdate?: ChannelUpdate<any>,
    timeout = 20_000,
    numRetries = 0,
  ): Promise<
    Result<
      { update: ChannelUpdate<any>; previousUpdate: ChannelUpdate<any> },
      OutboundChannelUpdateError | InboundChannelUpdateError
    >
  > {
    const inbox = getRandomBytes32();
    const responsePromise = this.evt.pipe((e) => e.inbox === inbox).waitFor(timeout);
    this.evt.post({
      to: channelUpdate.toIdentifier,
      from: channelUpdate.fromIdentifier,
      replyTo: inbox,
      data: { update: channelUpdate, previousUpdate },
    });
    const res = await responsePromise;
    if (res.data.error) {
      return Result.fail(res.data.error);
    }
    return Result.ok({ update: res.data.update!, previousUpdate: res.data.previousUpdate! });
  }

  async respondToProtocolMessage(
    inbox: string,
    channelUpdate: ChannelUpdate<any>,
    previousUpdate?: ChannelUpdate<any>,
  ): Promise<void> {
    this.evt.post({
      inbox,
      data: { update: channelUpdate, previousUpdate },
      from: channelUpdate.toIdentifier,
    });
  }

  async respondWithProtocolError(inbox: string, error: InboundChannelUpdateError): Promise<void> {
    this.evt.post({
      inbox,
      data: { error },
      from: error.update.toIdentifier,
    });
  }

  async onReceiveProtocolMessage(
    myPublicIdentifier: string,
    callback: (
      result: Result<{ update: ChannelUpdate<any>; previousUpdate: ChannelUpdate<any> }, InboundChannelUpdateError>,
      from: string,
      inbox: string,
    ) => void,
  ): Promise<void> {
    this.evt
      .pipe(({ to }) => to === myPublicIdentifier)
      .attach(({ data, replyTo, from }) => {
        callback(
          Result.ok({
            previousUpdate: data.previousUpdate!,
            update: data.update!,
          }),
          from,
          replyTo!,
        );
      });
  }

  sendSetupMessage(
    setupInfo: Result<Omit<EngineParams.Setup, "counterpartyIdentifier">, Error>,
    to: string,
    from: string,
    timeout?: number,
    numRetries?: number,
  ): Promise<Result<{ channelAddress: string }, MessagingError>> {
    throw new Error("Method not implemented.");
  }

  onReceiveSetupMessage(
    publicIdentifier: string,
    callback: (
      setupInfo: Result<Omit<EngineParams.Setup, "counterpartyIdentifier">, MessagingError>,
      from: string,
      inbox: string,
    ) => void,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  respondToSetupMessage(inbox: string, params: Result<{ channelAddress: string }, Error>): Promise<void> {
    throw new Error("Method not implemented.");
  }

  sendRequestCollateralMessage(
    requestCollateralParams: Result<EngineParams.RequestCollateral, Error>,
    to: string,
    from: string,
    timeout?: number,
    numRetries?: number,
  ): Promise<Result<undefined, Error>> {
    throw new Error("Method not implemented.");
  }

  onReceiveRequestCollateralMessage(
    publicIdentifier: string,
    callback: (params: Result<EngineParams.RequestCollateral, Error>, from: string, inbox: string) => void,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  respondToRequestCollateralMessage(inbox: string, params: Result<{ message?: string }, Error>): Promise<void> {
    throw new Error("Method not implemented.");
  }

  sendRestoreStateMessage(
    restoreData: Result<{ chainId: number } | { channelAddress: string }, EngineError>,
    to: string,
    from: string,
    timeout?: number,
    numRetries?: number,
  ): Promise<Result<{ channel: FullChannelState; activeTransfers: FullTransferState[] } | void, EngineError>> {
    throw new Error("Method not implemented.");
  }
  onReceiveRestoreStateMessage(
    publicIdentifier: string,
    callback: (
      restoreData: Result<{ chainId: number } | { channelAddress: string }, EngineError>,
      from: string,
      inbox: string,
    ) => void,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  respondToRestoreStateMessage(
    inbox: string,
    restoreData: Result<{ channel: FullChannelState; activeTransfers: FullTransferState[] } | void, EngineError>,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  respondToLockMessage(inbox: string, lockInformation: Result<LockInformation, LockError>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onReceiveLockMessage(
    myPublicIdentifier: string,
    callback: (lockInfo: Result<LockInformation, LockError>, from: string, inbox: string) => void,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  sendLockMessage(
    lockInfo: Result<LockInformation, LockError>,
    to: string,
    from: string,
    timeout?: number,
    numRetries?: number,
  ): Promise<Result<LockInformation, LockError>> {
    throw new Error("Method not implemented.");
  }

  sendIsAliveMessage(
    isAliveInfo: Result<IsAliveInfo, IsAliveError>,
    to: string,
    from: string,
    timeout?: number,
    numRetries?: number,
  ): Promise<Result<void, IsAliveError>> {
    throw new Error("Method not implemented.");
  }
  onReceiveIsAliveMessage(
    publicIdentifier: string,
    callback: (isAliveInfo: Result<IsAliveInfo, IsAliveError>, from: string, inbox: string) => void,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  respondToIsAliveMessage(inbox: string, params: Result<IsAliveResponse, IsAliveError>): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async subscribe(subject: string, callback: (data: any) => void): Promise<void> {
    throw new Error("Method not implemented.");
  }

  request(subject: string, timeout: number, data: any): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async publish(subject: string, data: any): Promise<void> {
    throw new Error("Method not implemented.");
  }

  unsubscribe(subject: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
