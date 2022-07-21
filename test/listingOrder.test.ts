// @ts-ignore
import * as secrets from '../../secrets.json'
import {X2Y2API} from "../src/api";
import {Asset, ETHToken, NullToken, Web3Accounts} from "web3-accounts";
import {X2Y2SDK} from "../src/index";

const seller = '0x20E30b5a64960A08DFb64bEB8Ab65D860cD71Da7';
const chainId = 1;

; // @ts-ignore
(async () => {
    const wallet = {
        chainId,
        address: seller,
        privateKeys: secrets.privateKeys,
        rpcUrl:{
            url:"https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
        }
    }

    const sdk = new X2Y2SDK(wallet)

    // const tokenAddress = "0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF"
    // const tokenId = "1120101"
    const tokenAddress = "0x6D77496B7C143D183157E8b979e47a0A0180e86B"
    const tokenId = "1"

    // const userAccount = new Web3Accounts(wallet)
    //
    // const ll = await userAccount.getERC721Approved(tokenAddress,sdk.erc721Delegate)

    const asset = {
        tokenAddress,
        tokenId,
        schemaName: "ERC721",
        collection: {
            royaltyFeePoints: 500,
            royaltyFeeAddress: ""
        }
    } as Asset
    const order = await sdk.createSellOrder({
        asset,
        quantity: 1,
        paymentToken: NullToken,
        startAmount: 0.96,
        expirationTime: Math.round(Date.now() / 1000) + 3600
    })
    const api = new X2Y2API({apiKey: secrets.x2y2ApiKey})
    const orderRes = await api.postOrder(JSON.stringify(order))
    console.log(orderRes)

})()
