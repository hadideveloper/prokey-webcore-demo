/*
 * This is part of PROKEY HARDWARE WALLET project
 * Copyright (C) Prokey.io
 * 
 * Hadi Robati, hadi@prokey.io
 * Ali Akbar Mohammadi
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { ICoinCommands } from "./ICoinCommand";
import * as ProkeyResponses from "../models/Prokey";
import * as PathUtil from "../utils/pathUtils";
import * as Utility from "../utils/utils";
import { GeneralErrors } from "../models/GeneralResponse";
import { CoinBaseType, CoinInfo } from "../coins/CoinInfo";
import { TronCoinInfoModel } from "../models/CoinInfoModel";

import {
  SignedTx,
  MessageSignature,
  LiskMessageSignature,
  Success,
  TronAddress,
  TronTransaction,
  TronSignedTx
} from "../models/Prokey";
import { Device } from "./Device";

export class TronCommands implements ICoinCommands {
  private _coinInfo: TronCoinInfoModel;

  public constructor(coinName: string) {
    this._coinInfo = CoinInfo.Get<TronCoinInfoModel>(
      coinName,
      CoinBaseType.Tron
    );
    if (this._coinInfo == null) {
      throw new Error(`Cannot load CoinInfo for ${coinName}`);
    }
  }

  GetCoinInfo(): TronCoinInfoModel {
    return this._coinInfo;
  }
  /**
   * Gets Tron Address
   * @param device Prokey Device Object
   * @param path todo ? path
   * @param showOnProkey  whether display public key on device or not
   * @returns Promise<ProkeyResponses.TronAddress>
   */
  public async GetAddress(
    device: Device,
    path: Array<number>,
    showOnProkey?: boolean
  ): Promise<TronAddress> {
    if (device == null || path == null) {
      return Promise.reject({
        success: false,
        errorCode: GeneralErrors.INVALID_PARAM,
      });
    }

    let showDisplay = showOnProkey == null ? true : showOnProkey;

    // convert path to array of num
    let address_n: Array<number>;
    if (typeof path == "string") {
      try {
        address_n = PathUtil.getHDPath(path);
      } catch (e) {
        return Promise.reject({
          success: false,
          errorCode: GeneralErrors.PATH_NOT_VALID,
        });
      }
    } else {
      address_n = path;
    }

    let param = {
      address_n: address_n,
      show_display: showDisplay,
    };

    return await device.SendMessage<ProkeyResponses.TronAddress>(
      "TronGetAddress",
      param,
      "TronAddress"
    );
  }
  /**
   * Gets a list of Tron addresses
   * @param device Prokey device object
   * @param paths list of paths to retrieve their address
   * @returns Array<ProkeyResponses.TronAddress>
   */
  public async GetAddresses(
    device: Device,
    paths: Array<Array<number>>
  ): Promise<TronAddress[]> {
    if (device == null || paths == null) {
      return Promise.reject({
        success: false,
        errorCode: GeneralErrors.INVALID_PARAM,
      });
    }

    let lstAddress = new Array<ProkeyResponses.TronAddress>();

    paths.forEach(async (path) => {
      let pn: Array<number>;
      if (typeof path == "string") {
        try {
          pn = PathUtil.getHDPath(path);
        } catch (e) {
          return Promise.reject({
            success: false,
            errorCode: GeneralErrors.PATH_NOT_VALID,
          });
        }
      } else {
        pn = path;
      }

      let param = {
        address_n: pn,
        show_display: false,
      };

      try {
        let address = await device.SendMessage<ProkeyResponses.TronAddress>(
          "TronGetAddress",
          param,
          "TronAddress"
        );
        lstAddress.push(address);
      } catch (e) {
        Promise.reject(e);
      }
    });

    return lstAddress;
  }
  /**
   * Get Public Key
   * @param device Prokey Device Object
   * @param path todo: ? path
   * @param showOnProkey  whether display public key on device or not
   * @returns Promise<ProkeyResponses.PublicKey>
   */
  public async GetPublicKey(
    device: Device,
    path: string | number[],
    showOnProkey?: boolean
  ): Promise<ProkeyResponses.PublicKey> {
    if (device == null || path == null) {
      return Promise.reject({
        success: false,
        errorCode: GeneralErrors.INVALID_PARAM,
      });
    }

    let showDisplay = showOnProkey == null ? true : showOnProkey;

    // convert path to array of num
    let address_n: Array<number>;
    if (typeof path == "string") {
      try {
        address_n = PathUtil.getHDPath(path);
      } catch (e) {
        return Promise.reject({
          success: false,
          errorCode: GeneralErrors.PATH_NOT_VALID,
        });
      }
    } else {
      address_n = path;
    }

    let param = {
      address_n: address_n,
      show_display: showDisplay,
    };

    return await device.SendMessage<ProkeyResponses.PublicKey>(
      "GetPublicKey",
      param,
      "PublicKey"
    );
  }

  public async SignTransaction(
    device: Device,
    transaction: TronTransaction
  ): Promise<TronSignedTx> {
    return await device.SendMessage<TronSignedTx>("TronSignTx", transaction, "TronSignedTx");
  }
  /**
   * Signs a Message
   * @param device Prokey Device Object
   * @param paths Array of paths
   * @param message Message to be signed
   * @param coinName Optional name of the coin
   * @returns Promise<ProkeyResponses.MessageSignature>
   */
  public async SignMessage(
    device: Device,
    paths: Array<number>,
    message: Uint8Array,
    coinName?: string
  ): Promise<MessageSignature | LiskMessageSignature> {
    let scriptType = PathUtil.GetScriptType(paths);

    let res = await device.SendMessage<ProkeyResponses.MessageSignature>(
      "SignMessage",
      {
        address_n: paths,
        message: message,
        coin_name: coinName || "TRON",
        script_type: scriptType,
      },
      "MessageSignature"
    );

    if (res.signature) {
      res.signature = Utility.ByteArrayToHexString(res.signature);
    }

    return res;
  }
  /**
   * Verifies Message on device
   * @param device Prokey Device Object
   * @param address Tron Address in string
   * @param message Message data to be sent to device
   * @param signature Signature data
   * @param coinName Optional name of the coin
   * @returns Promise<ProkeyResponses.Success>
   */
  public async VerifyMessage(
    device: Device,
    address: string,
    message: Uint8Array,
    signature: Uint8Array,
    coinName?: string
  ): Promise<Success> {
    return await device.SendMessage<ProkeyResponses.Success>(
      "VerifyMessage",
      {
        address: address,
        signature: signature,
        message: message,
        coin_name: coinName || "TRON",
      },
      "Success"
    );
  }
}
