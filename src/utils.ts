import {ethers, utils} from "ethers";
import {X2Y2Order} from "@x2y2-io/sdk/dist/types";
import {DELEGATION_TYPE_ERC721, INTENT_SELL} from "@x2y2-io/sdk";
import {RunInput} from "./types";



export function randomSalt(): string {
    const randomHex = ethers.BigNumber.from(ethers.utils.randomBytes(16)).toHexString()
    return ethers.utils.hexZeroPad(randomHex, 64)
}

export type Pair721 = {
    token: string
    tokenId: string | number
}

export function encodeItemData(data: Pair721[]): string {
    return ethers.utils.defaultAbiCoder.encode(
        ['tuple(address token, uint256 tokenId)[]'],
        [data]
    )
}

export function decodeItemData(data: string) {
    return ethers.utils.defaultAbiCoder.decode(
        ['tuple(address token, uint256 tokenId)[]'],
        data
    )
}

const orderItemParamType = `tuple(uint256 price, bytes data)`

export function getOrderHash(order: X2Y2Order) {
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
    const orderData: string = ethers.utils.defaultAbiCoder.encode(
        orderParamTypes,
        [
            order.salt,
            order.user,
            order.network,
            order.intent,
            order.delegateType,
            order.deadline,
            order.currency,
            order.dataMask,
            order.items.length,
            order.items,
        ]
    )
    return ethers.utils.keccak256(orderData)
}

const orderParamType = `tuple(uint256 salt, address user, uint256 network, uint256 intent, uint256 delegateType, uint256 deadline, address currency, bytes dataMask, ${orderItemParamType}[] items, bytes32 r, bytes32 s, uint8 v, uint8 signVersion)`

export function encodeOrder(order: X2Y2Order) {
    return ethers.utils.defaultAbiCoder.encode([orderParamType], [order])
}

export function decodeOrder(order: string) {
    return utils.defaultAbiCoder.decode([orderParamType], order)
}

export function makeSellOrder(
    chainId: number,
    user: string,
    expirationTime: number,
    items: { price: string; data: string }[]
) {
    if (expirationTime < Math.round(Date.now() / 1000) + 900) {
        throw new Error('The expiration time has to be 15 minutes later.')
    }
    const salt = randomSalt()
    return {
        salt,
        user,
        network: chainId,
        intent: INTENT_SELL,
        delegateType: DELEGATION_TYPE_ERC721,
        deadline: expirationTime,
        currency: ethers.constants.AddressZero,
        dataMask: '0x',
        items,
        r: '',
        s: '',
        v: 0,
        signVersion: 1,
    }
}


const cancelInputParamType = `tuple(bytes32[] itemHashes, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`


// const orderItemParamType = `tuple(uint256 price, bytes data)`
// const orderParamType = `tuple(uint256 salt, address user, uint256 network, uint256 intent, uint256 delegateType, uint256 deadline, address currency, bytes dataMask, ${orderItemParamType}[] items, bytes32 r, bytes32 s, uint8 v, uint8 signVersion)`
//
const feeParamType = `tuple(uint256 percentage, address to)`
const settleDetailParamType = `tuple(uint8 op, uint256 orderIdx, uint256 itemIdx, uint256 price, bytes32 itemHash, address executionDelegate, bytes dataReplacement, uint256 bidIncentivePct, uint256 aucMinIncrementPct, uint256 aucIncDurationSecs, ${feeParamType}[] fees)`
const settleSharedParamType = `tuple(uint256 salt, uint256 deadline, uint256 amountToEth, uint256 amountToWeth, address user, bool canFail)`
const runInputParamType = `tuple(${orderParamType}[] orders, ${settleDetailParamType}[] details, ${settleSharedParamType} shared, bytes32 r, bytes32 s, uint8 v)`


export function decodeRunInput(data: string): RunInput {
    return ethers.utils.defaultAbiCoder.decode(
        [runInputParamType],
        data
    )[0] as RunInput
}
