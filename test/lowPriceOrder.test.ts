// @ts-ignore
import * as secrets from '../../secrets.json'
import {X2Y2API} from "../src/api";
import {Asset, ETHToken, NullToken, Web3Accounts} from "web3-accounts";
import {X2Y2SDK} from "../src/index";
import {ethers} from "ethers";

// const seller = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a';
const seller = '0x20E30b5a64960A08DFb64bEB8Ab65D860cD71Da7';
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

    // const tokenAddress = "0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF"
    // const tokenId = "1120101"
    const tokenAddress = "0x6D77496B7C143D183157E8b979e47a0A0180e86B"
    const tokenId = "1"
    const orderList = await sdk.api.getOrders({
        maker: seller,
        tokenAddress,
        tokenId
    })
    const order = orderList.orders[0]

    const fee = await sdk.getAssetsFees([tokenId])

    const params = {
        orderStr: JSON.stringify(order),
        basePrice: ethers.utils.parseEther("0.16").toString(),
        royaltyFeeAddress: fee[0].royaltyFeeAddress,
        royaltyFeePoints: fee[0].royaltyFeePoints
    }
    const lowOrder = await sdk.adjustOrder(params)

    const orderRes = await sdk.postOrder(JSON.stringify(lowOrder))
    console.log(orderRes)

})()
