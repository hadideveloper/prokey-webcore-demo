/* @flow */
'use strict';

import { EnumOutputScriptType, AddressModel, EnumInputScriptType } from '../models/Prokey';
import { BitcoinBaseCoinInfoModel } from '../models/CoinInfoModel';
import { bech32 } from 'bech32';
import { bchaddrjs } from 'bchaddrjs';
import { bs58check } from 'bs58check';


export const HD_HARDENED = 0x80000000;
export const toHardened = (n: number): number => (n | HD_HARDENED) >>> 0;
export const fromHardened = (n: number): number => (n & ~HD_HARDENED) >>> 0;

export const invalidParameter = (msg: string): void => {

};

const PATH_NOT_VALID = invalidParameter('Not a valid path.');
const PATH_NEGATIVE_VALUES = invalidParameter('Path cannot contain negative values.');

export const getHDPath = (path: string): Array<number> => {
    const parts: Array<string> = path.toLowerCase().split('/');
    if (parts[0] !== 'm') {
        throw PATH_NOT_VALID;
    }

    return parts.filter((p: string) => p !== 'm' && p !== '')
        .map((p: string) => {
            let hardened = false;
            if (p.substr(p.length - 1) === "'") {
                hardened = true;
                p = p.substr(0, p.length - 1);
            }
            let n: number = parseInt(p, 10);
            if (isNaN(n)) {
                throw PATH_NOT_VALID;
            } else if (n < 0) {
                throw PATH_NEGATIVE_VALUES;
            }
            if (hardened) { // hardened index
                n = toHardened(n);
            }
            return n;
        });
};

export function IsSegwitPath(path: Array<number> | any): boolean  {
    return Array.isArray(path) && path[0] === toHardened(49);
};

export function IsNativeSegwitPath(path: Array<number> | any): boolean  {
    return Array.isArray(path) && path[0] === toHardened(84);
};

export const validatePath = (path: string | Array<number>, length: number = 0, base: boolean = false): Array<number> => {
    let valid: Array<number> = [];
    if (typeof path === 'string') {
        valid = getHDPath(path);
    } else if (Array.isArray(path)) {
        valid = path.map((p: any) => {
            const n: number = parseInt(p, 10);
            if (isNaN(n)) {
                throw PATH_NOT_VALID;
            } else if (n < 0) {
                throw PATH_NEGATIVE_VALUES;
            }
            return n;
        });
    }

    if (!valid) {
        throw PATH_NOT_VALID;
    }

    if (length > 0 && valid.length < length) {
        throw PATH_NOT_VALID;
    }
    return base ? valid.splice(0, 3) : valid;
};

export function getSerializedPath(path: Array<number>): string {
    return path.map((i) => {
        const s = (i & ~HD_HARDENED).toString();
        if (i & HD_HARDENED) {
            return s + "'";
        } else {
            return s;
        }
    }).join('/');
}

export const getPathFromIndex = (bip44purpose: number, bip44cointype: number, index: number): Array<number> => {
    return [
        toHardened(bip44purpose),
        toHardened(bip44cointype),
        toHardened(index),
    ];
};

export function getIndexFromPath(path: Array<number>): number {
    if (path.length < 3) {
        throw invalidParameter(`getIndexFromPath: invalid path length ${path.toString()}`);
    }
    return fromHardened(path[2]);
}

// export const getAccountLabel = (path: Array<number>, coinInfo: CoinInfo): string => {
//     const coinLabel: string = coinInfo.label;
//     const p1: number = fromHardened(path[0]);
//     const account: number = fromHardened(path[2]);
//     const realAccountId: number = account + 1;
//     const prefix = 'Export info of';
//     let accountType = '';

//     if (p1 === 48) {
//         accountType = `${coinLabel} multisig`;
//     } else if (p1 === 44 && coinInfo.segwit) {
//         accountType = `${coinLabel} legacy`;
//     } else {
//         accountType = coinLabel;
//     }
//     return `${prefix} ${accountType} <span>account #${realAccountId}</span>`;
// };


// export const getLabel = (label: string, coinInfo: CoinInfo): string => {
//     if (coinInfo) {
//         return label.replace('#NETWORK', coinInfo.label);
//     }
//     return label.replace('#NETWORK', '');
// };

export function GetScriptType(path?: Array<number>): EnumInputScriptType {
    if (!Array.isArray(path) || path.length < 1){ 
        return EnumInputScriptType.SPENDADDRESS;
    }

    const p1 = fromHardened(path[0]);
    switch (p1) {
        case 48:
            return EnumInputScriptType.SPENDMULTISIG;
        case 49:
            return EnumInputScriptType.SPENDP2SHWITNESS;
        case 84:
            return EnumInputScriptType.SPENDWITNESS;
        default:
            return EnumInputScriptType.SPENDADDRESS;
    }
}

export function GetOutputScriptTypeFromPath(path?: Array<number>): EnumOutputScriptType {
    if (!Array.isArray(path) || path.length < 1) 
        return EnumOutputScriptType.PAYTOADDRESS;
    const p = fromHardened(path[0]);
    switch (p) {
        case 48:
            return EnumOutputScriptType.PAYTOMULTISIG;
        case 49:
            return EnumOutputScriptType.PAYTOP2SHWITNESS;
        case 84:
            return EnumOutputScriptType.PAYTOWITNESS;
        default:
            return EnumOutputScriptType.PAYTOADDRESS;
    }
}

export function GetOutputScriptTypeFromAddress(address: string, coinInfo: BitcoinBaseCoinInfoModel):  
    EnumOutputScriptType.PAYTOWITNESS | 
    EnumOutputScriptType.PAYTOSCRIPTHASH | 
    EnumOutputScriptType.PAYTOADDRESS{
    //! If the address is Native segwit(Bech32) address (like bc1, tb1 and etc), the output script should be PAYTOWITNESS
    if(IsBech32Address(address)) {
        return EnumOutputScriptType.PAYTOWITNESS;
    }

    if(IsScriptHash(address, coinInfo)) {
        return EnumOutputScriptType.PAYTOSCRIPTHASH;
    }

    return EnumOutputScriptType.PAYTOADDRESS;
}

export function GetListOfBipPath(
    coinBip44: number,          // SLIP44 coin ID, https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    account: number,            // Account number, In Ethereum like coins, it should be 0, because each address is an account.
    numberOfAddress: number,    // Number of paths
    isSegwit: boolean,          // Is it Segwit coin? (In Ethereum like coins, it should be 0)
    isChange: boolean = false,  // Is it change address? (In Ethereum like coins, it should be 0)
    startIndex: number = 0,     // Path Index
    isNativeSegwit = false      // Is BIP84 path needed?, https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki
    ): Array<AddressModel>{
    let paths: Array<AddressModel> = new Array<AddressModel>();
    for(let i = 0; i<numberOfAddress; i++) {

        // m / purpose' / coin_type' / account' / change / address_index
        let pathStr = 'm';
        
        // purpose: Bip44 or 49
        if(isNativeSegwit) {
            pathStr += `/84'`;
        }
        else if(isSegwit) {
            pathStr += `/49'`;
        }
        else {
            pathStr += `/44'`;
        }

        // / coin_type' / account'
        pathStr += `/${coinBip44}'/${account}'`;

        // / change
        pathStr += (isChange) ? '/1' : '/0';

        // / address_index
        pathStr += `/${startIndex+i}`;

        let path: AddressModel = {
            path: [ 
                0x80000000 + (isNativeSegwit ? 84 : (isSegwit ? 49 : 44)),
                0x80000000 + coinBip44,
                0x80000000 + account,
                (isChange) ? 1 : 0,
                startIndex + i,
            ],
            serializedPath: pathStr,
            address: "",
        }

        paths.push(path);
    }
    return paths;
}

export function IsScriptHash(address: string, coinInfo: BitcoinBaseCoinInfoModel): boolean {
    if(IsBech32Address(address) == false) {
        // Cashaddr format (with prefix) is neither base58 nor bech32, so it would fail
        // in FromBase58Check. For this reason, we use legacy format here
        if(coinInfo.cashaddr_prefix) {
            address = bchaddrjs.toLegacyAddress(address);
        }

        const decode = FromBase58Check(address);
        if(decode.version == coinInfo.p2pkh_address_version) {
            return false;
        } else if( decode.version == coinInfo.p2sh_address_version) {
            return true;
        }

    } else {
        const decoded = FromBech32(address);
        if (decoded.data.length == 20) {
            return false;
        }
        if (decoded.data.length == 32) {
            return true;
        }
    }

    throw new Error("Unknown address type");
}


export function FromBase58Check (address: string) {
    var payload = bs58check.decode(address)
  
    // TODO: 4.0.0, move to "toOutputScript"
    if (payload.length < 21) throw new TypeError(address + ' is too short')
    if (payload.length > 22) throw new TypeError(address + ' is too long')
  
    var multibyte = payload.length === 22
    var offset = multibyte ? 2 : 1
  
    var version = multibyte ? payload.readUInt16BE(0) : payload[0]
    var hash = payload.slice(offset)
  
    return { version: version, hash: hash }
}

export function FromBech32(address: string) {
    var result = bech32.decode(address)
    var data = bech32.fromWords(result.words.slice(1))
    return {
        version: result.words[0],
        prefix: result.prefix,
        data: Buffer.from(data)
    }
}

export function IsBech32Address(address: string): boolean {
    try {
        FromBech32(address);
        return true;
    } catch(e) {
        return false;
    }
}

