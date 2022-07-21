// @ts-ignore
import * as secrets from '../../secrets.json'
import {X2Y2API} from "../src/api";
import {Asset, ETHToken, NullToken, Web3Accounts} from "web3-accounts";
import {X2Y2SDK} from "../src/index";
import {ethers} from 'web3-wallets';
import {bnToString, Web3ABICoder} from "web3-abi-coder";
import {decodeRunInput} from "../src/utils";
import {exchangeABI} from "../src/config";

const seller = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a';
const buyer = "0x20E30b5a64960A08DFb64bEB8Ab65D860cD71Da7"
const chainId = 1;

; // @ts-ignore
(async () => {
    // const signer = ethersProvider.getSigner()
    const wallet = {
        chainId,
        address: seller,
        privateKeys: secrets.privateKeys
    }

    const sdk = new X2Y2SDK(wallet, {apiKey: secrets.x2y2ApiKey})

    const tokenAddress = "0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF"
    const tokenId = "1120101"
    const asset = {
        tokenAddress,
        tokenId,
        schemaName: "ERC721"
    } as Asset
    // const orderStr = await sdk.createSellOrder({
    //     asset,
    //     quantity: 1,
    //     paymentToken: NullToken,
    //     startAmount: 0.11,
    //     expirationTime: Math.round(Date.now() / 1000) + 960
    // })
    // const orderRes = await sdk.api.postOrder(orderStr)

    // const res = await sdk.api.getOrders({maker:seller,tokenAddress,tokenId})

    const orderId = 5226088// res.orders[0].id;
    const price = ethers.utils.parseEther("0.11").toString()
    const inputs = await sdk.api.getOrderSign({account: buyer, orderId, price})
    const input =inputs[0].input
    const foo = decodeRunInput(input)
    const bar = new Web3ABICoder(exchangeABI).decodeInputParams('run',input)
    console.log(foo,bar)
    // console.log(bnToString(input))

})()
