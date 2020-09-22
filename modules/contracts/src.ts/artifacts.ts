import { HexString } from "@connext/types";
import { utils } from "ethers";

import * as Adjudicator from "../artifacts/Adjudicator.json";
import * as ChannelFactory from "../artifacts/ChannelFactory.json";
import * as ChannelMastercopy from "../artifacts/ChannelMastercopy.json";
import * as ERC20 from "../artifacts/IERC20.json";
import * as LinkedTransfer from "../artifacts/LinkedTransfer.json";
import * as TestToken from "../artifacts/TestToken.json";
import * as TransferDefinition from "../artifacts/ITransferDefinition.json";
import * as VectorChannel from "../artifacts/IVectorChannel.json";
import * as Withdraw from "../artifacts/Withdraw.json";

type Abi = Array<string | utils.FunctionFragment | utils.EventFragment | utils.ParamType>;

type Artifact = {
  contractName: string;
  abi: Abi;
  bytecode: HexString;
  deployedBytecode: HexString;
};

type Artifacts = { [contractName: string]: Artifact };

export const artifacts: Artifacts = {
  Adjudicator,
  ChannelFactory,
  ChannelMastercopy,
  ERC20,
  LinkedTransfer,
  TestToken,
  TransferDefinition,
  VectorChannel,
  Withdraw,
} as any;

export {
  Adjudicator,
  ChannelFactory,
  ChannelMastercopy,
  ERC20,
  LinkedTransfer,
  TestToken,
  TransferDefinition,
  VectorChannel,
  Withdraw,
};
