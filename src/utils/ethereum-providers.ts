import { BigNumber } from '@ethersproject/bignumber';
import { FeeData, JsonRpcProvider, TransactionRequest } from '@ethersproject/providers';
import Providers from '../../data/NetworkProviders.json'

export async function GetGasParams(chainId: number): Promise<FeeData>;
export async function GetGasParams(url: string): Promise<FeeData>;

export async function GetGasParams(param: any): Promise<FeeData> {
    const provider = await SetupProvider(param)
    return provider.getFeeData();
}


export async function EstimateGasLimit(chainId: number, transaction: TransactionRequest): Promise<BigNumber>
export async function EstimateGasLimit(url: string, transaction: TransactionRequest): Promise<BigNumber>

export async function EstimateGasLimit(param: any, transaction: TransactionRequest): Promise<BigNumber> {
    const provider = await SetupProvider(param);
    return provider.estimateGas(transaction);
}

///////////////////
// PRIVATE METHODS
///////////////////
async function SetupProvider(chainId: number): Promise<JsonRpcProvider>;
async function SetupProvider(url: string): Promise<JsonRpcProvider>;

async function SetupProvider(param: any) {
    return new Promise<JsonRpcProvider>(async (resolve, reject) => {
        let url = '';
        if (typeof param === 'number') {
            const tempUrl = GetNetworkUrl(param);
            if (tempUrl === undefined) {
                reject("Couldn't find any provider with specified chain id.");
            } else {
                url = tempUrl;
            }
        } else url = param;
        const jsonRpcProvider = new JsonRpcProvider(url);
        const timer = setTimeout(() => {
            reject('Connection timeout');
        }, 5000);
        const network = await jsonRpcProvider.ready;
        clearTimeout(timer);
        if (network.name) resolve(jsonRpcProvider);
        reject('Unknown error')
    })
}


function GetNetworkUrl(chainId: number): string | undefined {
    const network = Providers.find(item => item.chainId == chainId);
    return network?.url[0];
}