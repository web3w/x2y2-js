// @ts-ignore
import * as secrets from '../../secrets.json'
import {X2Y2API} from "../src/api";
import {Asset, ETHToken, NullToken, Web3Accounts} from "web3-accounts";
import {X2Y2SDK} from "../src/index";
import {ethers, NULL_ADDRESS} from 'web3-wallets';
import {bnToString, Web3ABICoder} from "web3-abi-coder";
// import {decodeRunInput} from "../src/utils";
import {exchangeABI} from "../src/config";

const buyer = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a';
// const buyer = "0x20E30b5a64960A08DFb64bEB8Ab65D860cD71Da7"
const chainId = 1;

; // @ts-ignore
(async () => {
    // const signer = ethersProvider.getSigner()
    const wallet = {
        chainId,
        address: buyer,
        privateKeys: secrets.privateKeys
    }

    const sdk = new X2Y2SDK(wallet, {apiKey: secrets.x2y2ApiKey})

    const tokenAddress = "0x6D77496B7C143D183157E8b979e47a0A0180e86B"
    const tokenId = "1"
    const asset = {
        tokenAddress,
        tokenId,
        schemaName: "ERC721"
    } as Asset
    // const sellOrder = await sdk.createSellOrder({
    //     asset,
    //     quantity: 1,
    //     paymentToken: NullToken,
    //     startAmount: 0.9,
    //     expirationTime: Math.round(Date.now() / 1000) + 3600
    // })
    // const sellOrderStr = JSON.stringify(sellOrder)
    // const orderRes = await sdk.api.postOrder(sellOrderStr)

    const res = await sdk.api.getOrders({maker: buyer, tokenAddress, tokenId})

    const order = res.orders[0]

    const orderStr = JSON.stringify(order,null,2)
    console.log(orderStr)

    // const gas = await sdk.fulfillOrder(orderStr)
    // const orderId = order.id;
    // const price = order.price
    // const currency = order.currency
    // const items = [
    //     {
    //         orderId,
    //         price,
    //         currency
    //     }
    // ]
    // const inputs = await sdk.api.getRunInput({account: seller, items})
    // const input = inputs[0].input
    // // const foo = decodeRunInput(input)
    // const bar =sdk.exchangeCoder.decodeInputParams('run', input)
    // console.log( bar)
    // console.log(bnToString(input))

})()
