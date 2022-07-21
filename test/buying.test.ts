import { BigNumber, BigNumberish, constants, PayableOverrides, utils } from 'ethers'
import * as secrets from '../../secrets.json'
import {X2Y2API} from "../src/api";
export type OrderItem = {
    price: BigNumberish
    data: string
}

export type Order = {
    salt: BigNumberish
    user: string
    network: BigNumberish
    intent: BigNumberish
    delegateType: BigNumberish
    deadline: BigNumberish
    currency: string
    dataMask: string
    items: OrderItem[]
    // signature
    r: string
    s: string
    v: number
    signVersion: number
}

export type Fee = {
    percentage: BigNumberish
    to: string
}

export type SettleDetail = {
    op: number
    orderIdx: BigNumberish
    itemIdx: BigNumberish
    price: BigNumberish
    itemHash: string
    executionDelegate: string
    dataReplacement: string
    bidIncentivePct: BigNumberish
    aucMinIncrementPct: BigNumberish
    aucIncDurationSecs: BigNumberish
    fees: Fee[]
}

export type SettleShared = {
    salt: BigNumberish
    deadline: BigNumberish
    amountToEth: BigNumberish
    amountToWeth: BigNumberish
    user: string
    canFail: boolean
}

export type RunInput = {
    orders: Order[]
    details: SettleDetail[]
    shared: SettleShared
    // signature
    r: string
    s: string
    v: number
}

export type OrderDetailPayload = {
    caller: string
    op: number
    amountToEth: string
    amountToWeth: string
    items: {
        orderId: number
        royalty?: number
        currency?: string
        price?: string
        contract?: string
        tokenId?: string
    }[]
}

export type OrderDetailResp = {
    success: boolean
    code: number
    data?: {
        order_id: number
        input: string
    }[]
    error?: string
}


// Server-side code in Next.js /api endpoint. Should be protected from malicious calls.
 const orderSign = async (
    payload: OrderDetailPayload,
): Promise<OrderDetailResp> => {
    const body = JSON.stringify(payload)
    const ac = new AbortController()
    const req = new Request('https://api.x2y2.io/api/orders/sign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-API-KEY': secrets.x2y2ApiKey, // api key
        },
        body,
        signal: ac.signal,
    })
    const timeout = setTimeout(() => ac.abort(), 60 * 1000)
    try {
        const fetchRes = await fetch(req)
        // Don't bother data on error here since we're going to adopt duan's method
        if (!fetchRes.ok) throw new Error('bad response')
        // Can be 'application/json' or 'application/json; charset=utf-8'
        const data = await fetchRes.json()
        return data as OrderDetailResp
    } catch (e) {
        throw e
    } finally {
        clearTimeout(timeout)
    }
}
// Client-side library

const orderItemParamType = `tuple(uint256 price, bytes data)`
const feeParamType = `tuple(uint256 percentage, address to)`
const settleDetailParamType = `tuple(uint8 op, uint256 orderIdx, uint256 itemIdx, uint256 price, bytes32 itemHash, address executionDelegate, bytes dataReplacement, uint256 bidIncentivePct, uint256 aucMinIncrementPct, uint256 aucIncDurationSecs, ${feeParamType}[] fees)`
const settleSharedParamType = `tuple(uint256 salt, uint256 deadline, uint256 amountToEth, uint256 amountToWeth, address user, bool canFail)`
const orderParamType = `tuple(uint256 salt, address user, uint256 network, uint256 intent, uint256 delegateType, uint256 deadline, address currency, bytes dataMask, ${orderItemParamType}[] items, bytes32 r, bytes32 s, uint8 v, uint8 signVersion)`
const runInputParamType = `tuple(${orderParamType}[] orders, ${settleDetailParamType}[] details, ${settleSharedParamType} shared, bytes32 r, bytes32 s, uint8 v)`

const fixSignature = (data: Order | RunInput) => {
    // in geth its always 27/28, in ganache its 0/1. Change to 27/28 to prevent
    // signature malleability if version is 0/1
    // see https://github.com/ethereum/go-ethereum/blob/v1.8.23/internal/ethapi/api.go#L465
    if (data.v < 27) {
        data.v = data.v + 27
    }
}

const decodeRunInput = (data: string): RunInput | undefined => {
    try {
        const result = utils.defaultAbiCoder.decode([runInputParamType], data)
        return result[0] as RunInput
    } catch (ignored) {
        console.log('decodeRunInput error', ignored)
    }
    return undefined
}

const isNative = (currency: string): boolean => {
    return !currency || currency === constants.AddressZero
}

const handleOrderResp = (resp: OrderDetailResp) => {
    let errorMsg = ''
    if (!resp.success) {
        if (resp.error) {
            errorMsg = 'some error messgae'
        }
    }
    if (errorMsg) {
        throw new Error(errorMsg)
    }
}

// const run = async (market: X2Y2R1, runInput: RunInput, value: BigNumber) => {
//     const options: PayableOverrides = { value }
//     try {
//         const gasLimit = await market.estimateGas.run(runInput, options)
//         options.gasLimit = gasLimit
//     } catch (ignored) {}
//     return market.run(runInput, options)
// }

const buyNow = async (
    user: string,
    items: {
        orderId: number
        currency: string
        price: BigNumber
    }[],
) => {
    const OP_COMPLETE_SELL_OFFER = 1
    // post encode order(INTENT_SELL)... to server
    const payload: OrderDetailPayload = {
        caller: user,
        op: OP_COMPLETE_SELL_OFFER,
        amountToEth: '0',
        amountToWeth: '0',
        items: items.map((item) => ({
            orderId: item.orderId,
            currency: item.currency,
            price: item.price.toString(),
        })),
    }

    // call server api
    const resp = await orderSign(payload)
    handleOrderResp(resp)

    // call market.run
    const data = resp.data
    const inputData = (data ? (data as any) : []) as {
        order_id: number
        input: string
    }[]
    const orders: {
        runInput: RunInput
        value: BigNumber
    }[] = []
    items.forEach((item) => {
        const input = inputData.find((d) => d.order_id === item.orderId)
        let value: BigNumber = BigNumber.from(0)
        let valid = true
        const runInput: RunInput | undefined = input
            ? decodeRunInput(input.input)
            : undefined
        if (runInput && runInput.orders.length && runInput.details.length) {
            runInput.details.forEach((detail) => {
                const order = runInput.orders[(detail.orderIdx as BigNumber).toNumber()]
                const orderItem = order?.items[(detail.itemIdx as BigNumber).toNumber()]
                if (detail.op !== OP_COMPLETE_SELL_OFFER || !orderItem) {
                    valid = false
                } else if (isNative(order.currency)) {
                    value = value.add(detail.price)
                }
            })
            if (valid) {
                fixSignature(runInput)
                runInput.orders.forEach((order) => fixSignature(order))
                orders.push({runInput, value})
            }
        }
    })
    // create market contract & call run method
    // const market = X2Y2R1__factory.connect(
    //     '0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3',
    //     user,
    // )
    // await Promise.all(
    //     orders.map((o) => run(market, o.runInput, o.value)),
    // )
}

// How to do the call the buyNow method on client.

(async ()=>{
    try {
        const user = '0x20E30b5a64960A08DFb64bEB8Ab65D860cD71Da7' // user address
        const items = [
            {
                orderId: 6816896,
                currency: '0x0000000000000000000000000000000000000000', // ETH
                price: utils.parseEther('0.1'),
            },
        ]
        const api = new X2Y2API({apiKey:secrets.x2y2ApiKey})
        const orders  =await api.getOrders({
            maker:user,
            tokenAddress:"0x6D77496B7C143D183157E8b979e47a0A0180e86B",
            tokenId:"1"
        })
        console.log(orders)
        // const fee = await api.getRunInput(items[0].orderId)
        // console.log(fee)
        // await buyNow(user, items)
    } catch (e) {
        console.error(e)
    }
})()
//

