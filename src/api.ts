import {
    APIConfig, X2Y2Order, SettleDetail, SettleShared, sleep, BaseFetch
} from "./types";

import {decodeRunInput} from "./utils";

export const X2Y2_API_KEY = "xx-xx" //2.5%

export const X2Y2_PROTOCOL_FEE_POINTS = 50
//Api Timeout
export const API_TIMEOUT = 10000

export const X2Y2_API_CONFIG = {
    1: {
        apiBaseUrl: 'https://api.x2y2.org'
    }
}


export class X2Y2API extends BaseFetch {
    constructor(
        config?: APIConfig
    ) {
        const chainId = config?.chainId || 1
        const url = config?.apiBaseUrl || X2Y2_API_CONFIG[chainId].apiBaseUrl || X2Y2_API_CONFIG[1].apiBaseUrl
        const apiBaseUrl = config?.apiBaseUrl || url
        super({
            apiBaseUrl,
            apiKey: config?.apiKey || X2Y2_API_KEY
        })
        if (X2Y2_API_CONFIG[chainId]) {
            this.proxyUrl = config?.proxyUrl
            this.apiTimeout = config?.apiTimeout || API_TIMEOUT
        } else {
            throw 'X2Y2 API unsport chainId:' + config?.chainId
        }
    }

    async getOrders(queryParams: { maker: string, tokenAddress: string, tokenId: string }, retries = 2): Promise<{ orders: any, count: number }> {
        try {
            const params: Record<string, string> = {
                maker: queryParams.maker,
                status: "open",
                contract: queryParams.tokenAddress,
                token_id: queryParams.tokenId,
                network_id: "1",
                limit: "1"
            }

            const json = await this.get(`/v1/orders`, params, {
                headers: {
                    'X-API-KEY': this.apiKey || ""
                }
            })
            if (!json.success) {
                throw new Error('X2YX get orders fail')
            }
            // debugger
            if (!json.data) {
                throw new Error('Not  found: no  matching  order  found')
            }
            const orders = json.data
            return {
                orders,
                count: orders.length
            }
        } catch (error: any) {
            console.log(error)
            throw new Error(error)
        }
    }

    async getAssets(contracts: string[], retries = 2) {
        try {
            const params = {
                "contracts": contracts,
                "network_id": "1"
            }
            //base rate is 1e6
            const json = await this.post(`/api/contracts/payment_info`, params, {
                headers: {
                    'X-API-KEY': this.apiKey || ""
                }
            }).catch((e: any) => {
                console.log(e)
                throw e
            })
            return json
        } catch (error: any) {
            console.log(error)
            throw new Error(error)
            // this.throwOrContinue(error, retries)
            // await sleep(3000)
            // return this.getAssets(contracts)
        }

    }

    async postOrder(order: any, retries = 2): Promise<any> {
        try {
            const opts = {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'X-API-KEY': this.apiKey || ""
                }
            }
            // console.log(this.apiBaseUrl + "/api/orders/add", singSellOrder)
            const result = await this.post(
                `/api/orders/add`,
                order,
                opts
            ).catch((e: any) => {
                console.log(e)
                throw e
            })
            return result

        } catch (error: any) {
            console.log(error)
            throw new Error(error)
            // this.throwOrContinue(error, retries)
            // await sleep(3000)
            // return this.postOrder(singSellOrder, retries)
        }
    }

    async getOrderSign(order: { account: string, orderId: number, price: string }): Promise<{ order_id: number; input: string }[]> {
        const {account, orderId, price} = order
        const OP_COMPLETE_SELL_OFFER = 1
        const payload = {
            "caller": account,
            "op": OP_COMPLETE_SELL_OFFER,
            "amountToEth": "0",
            "amountToWeth": "0",
            "items": [
                {
                    orderId,
                    price,
                    "currency": "0x0000000000000000000000000000000000000000"
                }
            ]
        }

        const data = await this.post(`/api/orders/sign`, payload, {
            headers: {
                'X-API-KEY': this.apiKey || ""
            }
        }).catch((e: any) => {
            console.log(e)
            throw new Error(e)
        })
        return (data ?? []) as { order_id: number; input: string }[]
        // const input = inputData.find(d => d.order_id === orderId)
        // return input
    }

    // export type OrderDetailResp = {
    //     success: boolean
    //     code: number
    //     data?: {
    //         order_id: number
    //         input: string
    //     }[]
    //     error?: string
    // }

}