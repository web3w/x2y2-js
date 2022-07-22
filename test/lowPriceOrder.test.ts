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
    const asset = {
        tokenAddress,
        tokenId,
        schemaName: "ERC721"
    } as Asset
    const sellOrder = await sdk.createSellOrder({
        asset,
        quantity: 1,
        paymentToken: NullToken,
        startAmount: 0.96,
        expirationTime: Math.round(Date.now() / 1000) + 1000
    })
    const api = new X2Y2API({apiKey: secrets.x2y2ApiKey})
    // const postOrderRes = await api.postOrder(JSON.stringify(sellOrder))

    const orderList = await api.getOrders({
        maker: seller,
        tokenAddress,
        tokenId
    })
    const order = orderList.orders[0]

    const lowPriceorder = {
        orderId: order.id,
        expirationTime: order.end_at,
        basePrice: order.price,
        tokenAddress: order.nft.token,
        tokenId: order.nft.token_id
    }

    const params = {
        orderStr: JSON.stringify(lowPriceorder),
        basePrice: ethers.utils.parseEther("0.91").toString(),
        royaltyFeeAddress: "",
        royaltyFeePoints: 0
    }
    const params1 ={
        "orderStr": "{\"orderId\":\"5397190\",\"expirationTime\":1658509147,\"basePrice\":\"119000000000000000\",\"tokenAddress\":\"0x6d77496b7c143d183157e8b979e47a0a0180e86b\",\"tokenId\":\"1\"}",
        "basePrice": "20000000000000000",
        "royaltyFeePoints": 0,
        "royaltyFeeAddress": ""
    }
    const lowOrder = await sdk.adjustOrder(params1)

    const orderRes = await api.postOrder(JSON.stringify(lowOrder))
    console.log(orderRes)

})()
