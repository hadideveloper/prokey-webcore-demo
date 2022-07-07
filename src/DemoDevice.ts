import * as ProkeyResponses from './models/Prokey';
import * as PathUtil from './utils/pathUtils';
import { AddressModel, HDPubNode } from './models/Prokey';

const DemoPubkeys = require("./../data/DemoPubkeys.json");
const DemoAddresses = require("./../data/DemoAddresses.json");

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

    public static GetAddress(path: Array<number> | string)
    {
        let[pathArray, pathStr] = this.GetPathAsTuple(path);
        let addr = DemoAddresses[pathStr] as string;

        let addressModel:AddressModel = {
            address: addr,
            path: pathArray
        };
        return addressModel;
    }

}