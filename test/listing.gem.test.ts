import {
    BigNumber,
    BigNumberish,
    constants, ethers,
    providers,
    utils,
} from 'ethers'
// @ts-ignore
import * as secrets from '../../secrets.json'
import {SignerProvider} from "web3-signer-provider";
import {X2Y2API} from "../src/api";
import {bnToString} from "web3-abi-coder";
import {Order} from "./buying.test";
import {splitECSignature, Web3Provider} from "web3-wallets";
import {Web3Accounts} from "web3-accounts";
import {getHashMessage} from "web3-signer-provider/lib/src/utils/rpc";


const orderItemParamType = `tuple(uint256 price, bytes data)`
const feeParamType = `tuple(uint256 percentage, address to)`
const settleDetailParamType = `tuple(uint8 op, uint256 orderIdx, uint256 itemIdx, uint256 price, bytes32 itemHash, address executionDelegate, bytes dataReplacement, uint256 bidIncentivePct, uint256 aucMinIncrementPct, uint256 aucIncDurationSecs, ${feeParamType}[] fees)`
const settleSharedParamType = `tuple(uint256 salt, uint256 deadline, uint256 amountToEth, uint256 amountToWeth, address user, bool canFail)`
const orderParamType = `tuple(uint256 salt, address user, uint256 network, uint256 intent, uint256 delegateType, uint256 deadline, address currency, bytes dataMask, ${orderItemParamType}[] items, bytes32 r, bytes32 s, uint8 v, uint8 signVersion)`
// const runInputParamType = `tuple(${orderParamType}[] orders, ${settleDetailParamType}[] details, ${settleSharedParamType} shared, bytes32 r, bytes32 s, uint8 v)`

const orderParamTypes = [
    `uint256`,
    `address`,
    `uint256`,
    `uint256`,
    `uint256`,
    `uint256`,
    `address`,
    `bytes`,
    `uint256`,
    `${orderItemParamType}[]`,
]
const decodeOrder = (order: string) => {
    return utils.defaultAbiCoder.decode([orderParamType], order)
}

const encodeOrder = (order: Order): string => {
        return utils.defaultAbiCoder.encode([orderParamType], [order])
    }
// How to do the call the sell method on client.
; // @ts-ignore
(async () => {
    try {

        //

        const gemOrderHash  = "0x26b0a89cb61cd2ade94fadf2968f7d598c6e07b233af6c72f695c2370c66be75"
        const orderGem = {
            "order": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000fd0072437b47177fa5e2e1661cd386c300000000000000000000000032f4b63a46c1d12ad82cabc778d75abf9889821a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000062e13263000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001c09b22e6137abc17a45058767d8e69905ac92a39397b08407664e86c5ce76a8b91007ff18eae214d806aa295ffd89f920ec98599ee2d3f54c16117f57d1edc8cd1000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000052f687b1c6aacc92b47da5209cf25d987c8766280000000000000000000000000000000000000000000000000000000000000001",
            "isBundle": false,
            "bundleName": "",
            "bundleDesc": "",
            "orderIds": [],
            "changePrice": false,
            "isCollection": false
        }
        const api = new X2Y2API({apiKey: secrets.x2y2ApiKey,proxyUrl:"http://127.0.0.1:7890"})
        // const res1 = await api.postOrder(orderGem)
        // console.log(res1)
        // return

        // const orderGemHash = utils.keccak256(orderGem.order)
        // console.assert(gemOrderHash == orderGemHash,"Error")

        // const ress = bnToString(decodeOrder(orderGem.order))
        // console.log(JSON.stringify(ress, null, 2))


        let order = decodeOrder(orderGem.order)[0]

        console.log(order.deadline.toString())
        const deadline = ethers.BigNumber.from(Math.round(Date.now() / 1000) + 60 * 60)
        console.log(deadline.toString())

        const orderData = utils.defaultAbiCoder.encode(orderParamTypes, [
            order.salt,
            order.user,
            order.network,
            order.intent,
            order.delegateType,
            deadline,
            order.currency,
            order.dataMask,
            order.items.length,
            order.items,
        ])
        const orderHash = utils.keccak256(orderData)


        const user = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a'
        const wallet = {
            chainId: 1,
            address: user,
            privateKeys: secrets.privateKeys
        }
        const sigerProvider = new SignerProvider(wallet)

        console.log(orderHash)

        //  const hashTest = "0x6b758f8b9fd36ac6077094783ffce92969fee53588d31fec3e2f33bc67450225"
        // const Test = await sigerProvider.signMessage(hashTest)
        // 0xdad60dfcab9559b8be3b425fa42221754e7146e6a87a628000311b8b843173b875a4c4c08136b443734cc292fbc6d69eecbe31d357f235c789c64d119838ce2f1b
        //

        const signtureStr = await sigerProvider.signMessage(orderHash)
        const signMsg = splitECSignature(signtureStr)
        console.log()

        // order.deadline = deadline
        // order.s = signMsg.s
        // order.r = signMsg.r
        // order.v = signMsg.v
        const orderEncoder =  encodeOrder({...order,deadline,r:signMsg.r,s:signMsg.s,v:signMsg.v})


        const res = await api.postOrder({
            bundleDesc: "",
            bundleName: "",
            changePrice: false,
            isBundle: false,
            isCollection: false,
            order: orderEncoder,
            orderIds: []
        })

        console.log(res)

    } catch (e) {
        console.error(e)
    }

})()
