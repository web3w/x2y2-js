// @ts-ignore
import * as secrets from '../../secrets.json'
import {X2Y2SDK} from "../src/index";
// import JsonRpcProvider from "ethers";

const seller = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401';
const chainId = 1

const wallet = {
    chainId,
    address: seller,
    privateKeys: secrets.privateKeys
}

const sdk = new X2Y2SDK(wallet,{apiKey:secrets.x2y2ApiKey});
; // @ts-ignore
(async () => {
    //
    // "0x52F687B1c6aACC92b47DA5209cf25D987C876628",

    const tx = await sdk.getAssetsFees(["0x6b0d7ed64d8facde81b76f8ea6598808ee93fb0b"])
    console.log(tx)

})()

