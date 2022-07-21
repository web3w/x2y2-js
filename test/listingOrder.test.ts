
// @ts-ignore
import * as secrets from '../../secrets.json'
import {X2Y2API} from "../src/api";
import {Asset, ETHToken, NullToken, Web3Accounts} from "web3-accounts";
import {X2Y2SDK} from "../src/index";

const seller = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a';
const chainId = 1;

; // @ts-ignore
(async () => {
    const wallet = {
        chainId,
        address: seller,
        privateKeys: secrets.privateKeys
    }

    const sdk = new X2Y2SDK(wallet)

    const tokenAddress = "0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF"
    const tokenId = "1120101"
    const asset = {
        tokenAddress,
        tokenId,
        schemaName: "ERC721"
    } as Asset
    const orderStr = await sdk.createSellOrder({
        asset,
        quantity: 1,
        paymentToken: NullToken,
        startAmount: 0.2,
        expirationTime: Math.round(Date.now() / 1000) + 3600
    })
    const api = new X2Y2API({apiKey: secrets.x2y2ApiKey})
    const orderRes = await api.postOrder(orderStr)
    console.log(orderRes)

})()
