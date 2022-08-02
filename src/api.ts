import {
    APIConfig, BaseFetch, Order
} from "./types";

import {OP_COMPLETE_SELL_OFFER, OP_CANCEL_OFFER} from "./utils";

export const X2Y2_API_KEY = "xx-xx" //2.5%
//Api Timeout
export const API_TIMEOUT = 10000

export const X2Y2_API_CONFIG = {
    1: {
        apiBaseUrl: 'https://api.x2y2.org/api'
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

    async getOrders(queryParams: { tokenAddress: string, tokenId: string, maker?: string,limit?:string }, retries = 2)
        : Promise<{ orders: Order, count: number }> {
        try {
            const params: Record<string, string> = {
                maker: queryParams.maker||"",
                status: "open",
                contract: queryParams.tokenAddress,
                token_id: queryParams.tokenId,
                network_id: "1",
                limit: queryParams.limit||"2"
            }

            const json = await this.get(`/orders`, params, {
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
            const json = await this.post(`/contracts/payment_info`, params, {
                headers: {
                    'X-API-KEY': this.apiKey || X2Y2_API_KEY
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

    async postOrder(orderStr: string, retries = 2): Promise<any> {
        const order = JSON.parse(orderStr)
        try {
            const opts = {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'X-API-KEY': this.apiKey || X2Y2_API_KEY
                }
            }
            const result = await this.post(
                `/orders/add`,
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
        }
    }

    async getRunInput(payload: any): Promise<{ order_id: number; input: string }[]> {

        const data = await this.post(`/orders/sign`, payload, {
            headers: {
                'X-API-KEY': this.apiKey || X2Y2_API_KEY
            }
        }).catch((e: any) => {
            console.log(e)
            throw new Error(e)
        })
        return (data ?? []) as { order_id: number; input: string }[]
        // const input = inputData.find(d => d.order_id === orderId)
        // return input
    }

    async getCancelInput(order: { account: string, orderIds: string[], signMessage, sign }): Promise<string> {
        const items = order.orderIds.map(val => ({orderId: Number(val)}))
        const payload = {
            caller: order.account,
            op: OP_CANCEL_OFFER,
            items,
            sign_message: order.signMessage,
            sign: order.sign
        }

        // console.log(this.apiBaseUrl, payload)
        const data = await this.post(`/orders/cancel`, payload, {
            headers: {
                'X-API-KEY': this.apiKey || X2Y2_API_KEY
            }
        }).catch((e: any) => {
            console.log(e)
            throw new Error(e)
        })

        return data.input
    }

}
