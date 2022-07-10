import * as ProkeyResponses from './models/Prokey';
import * as PathUtil from './utils/pathUtils';
import { AddressModel, EthereumAddress, HDPubNode } from './models/Prokey';

const DemoPubkeys = require("./../data/DemoPubkeys.json");
const DemoAddresses = require("./../data/DemoAddresses.json");

enum DemoCoins {
    bitcoin,
    ethereum
};
let CoinCodeToName = {
    "0'": DemoCoins.bitcoin,
    "60'": DemoCoins.ethereum    
};


export class DemoDevice{

    public static GetPathAsTuple(path: Array<number> | string): [Array<number> , string]{
        let pathStr = "";
    let pathArray: Array<number>=[];

    if (typeof path === 'string' || path instanceof String)
    {
        pathStr = path.toString();
    }
    else{
        pathArray = path;
        pathStr = PathUtil.getSerializedPath(path);
    }
    return [pathArray, pathStr];
        
    }

    public static GetPubkey(path: Array<number> | string){

        let[pathArray, pathStr] = this.GetPathAsTuple(path);        
        let xPubKey = DemoPubkeys[pathStr] as string;

        let pubNode:HDPubNode = {
            depth: 0, //number,
            fingerprint: 0, //number,
            child_num: 0, //number,
            chain_code: new TextDecoder().decode(new Uint8Array([])), //string,
            public_key: new TextDecoder().decode(new Uint8Array([])), //string,

        };
        let pubKey:ProkeyResponses.PublicKey = {
            node: pubNode,
            xpub: xPubKey
        };
        return pubKey;

    }

    // return AddressModel | EthereumAddress | LiskAddress | NEMAddress | RippleAddress | CardanoAddress | StellarAddress
    public static GetAddress(path: Array<number> | string):
    AddressModel | EthereumAddress
    {
        let[pathArray, pathStr] = this.GetPathAsTuple(path);
        let addr = DemoAddresses[pathStr] as string;

        let coin = CoinCodeToName[pathStr.split("/")[1]];
        switch(coin){
            case DemoCoins.bitcoin:
                let btcAddressModel:AddressModel = {
                    address: addr,
                    path: pathArray
                };
                return btcAddressModel;
            case DemoCoins.ethereum:
                let ethAddressModel:EthereumAddress = {
                    address: addr
                };
                return ethAddressModel;
            break;
            default:
                let addressModel:AddressModel = {
                    address: addr,
                    path: pathArray
                };
                return addressModel;
            
        }

        
       
    }

}