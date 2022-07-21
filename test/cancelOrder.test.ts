// @ts-ignore
import * as secrets from '../../secrets.json'
import {X2Y2API} from "../src/api";
import {Asset, ETHToken, NullToken, Web3Accounts} from "web3-accounts";
import {X2Y2SDK} from "../src/index";
import {ethers, NULL_ADDRESS} from 'web3-wallets';
import {bnToString, Web3ABICoder} from "web3-abi-coder";
// import {decodeRunInput} from "../src/utils";
import {exchangeABI} from "../src/config";
import {decodeCancelInput} from "../src/utils";

// const seller = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a';
const buyer = "0x20E30b5a64960A08DFb64bEB8Ab65D860cD71Da7"
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
    const order = await sdk.createSellOrder({
        asset,
        quantity: 1,
        paymentToken: NullToken,
        startAmount: 0.91,
        expirationTime: Math.round(Date.now() / 1000) + 960
    })
    const orderRes = await sdk.api.postOrder(order)

    const res = await sdk.api.getOrders({maker: buyer, tokenAddress, tokenId})
    const orderId = res.orders[0].id;
    const tx = await sdk.cancelOrders([orderId.toString()])
    console.log(tx.hash)
    await tx.wait
    console.log("Success", tx.hash)


})()
