// 一口价购买
import {addressesByNetwork, exchangeABI} from "./config";
import EventEmitter from 'events'
import {Contract, ethers} from "ethers"
import {
    AdjustOrderParams,
    APIConfig,
    BuyOrderParams,
    CreateOrderParams,
    ExchangetAgent,
    FeesInfo,
    MatchOrderOption,
    MatchParams,
    NullToken,
    OfferType,
    OrderSide,
    SellOrderParams,
    Token,
    tokenToAsset,
    transactionToCallData,
} from 'web3-accounts'
import {LimitedCallSpec, NULL_ADDRESS, splitECSignature, WalletInfo} from 'web3-wallets'
import {Order, Web3Accounts, X2Y2Order} from "./types";
import {X2Y2API} from "./api";
import {
    encodeItemData,
    encodeOrder,
    getOrderHash,
    makeBuyOrder,
    makeSellOrder,
    OP_COMPLETE_BUY_OFFER,
    OP_COMPLETE_SELL_OFFER
} from "./utils";
import {Web3ABICoder} from "web3-abi-coder";
import pkg from '../package.json'

const oneDay = Math.round((Date.now() / 1000 + (3600 * 24)))
const twentyMinutes = Math.round(Date.now() / 1000 + (60 * 20))

export class X2Y2SDK extends EventEmitter implements ExchangetAgent {
    public contracts: any
    public userAccount: Web3Accounts
    public walletInfo: WalletInfo
    public api: X2Y2API
    public contractAddresses: any
    public exchange: Contract
    public GasWarpperToken: Token
    public erc721Delegate: string
    public exchangeCoder: Web3ABICoder
    public version: string

    constructor(wallet: WalletInfo, config?: APIConfig) {
        super()
        this.version = pkg.version
        this.userAccount = new Web3Accounts(wallet)
        this.api = new X2Y2API({...config, chainId: wallet.chainId})
        this.walletInfo = wallet
        const contractAddresses = addressesByNetwork[wallet.chainId]
        this.contractAddresses = contractAddresses
        this.exchange = new Contract(contractAddresses.EXCHANGE, exchangeABI, this.userAccount.signer)
        this.erc721Delegate = contractAddresses.ERC721Delegate
        this.exchangeCoder = new Web3ABICoder(exchangeABI)
        this.GasWarpperToken = {
            name: 'GasToken',
            symbol: 'GasToken',
            address: contractAddresses.WETH,
            decimals: 18
        }
    }

    async getOrderApprove(params: CreateOrderParams, side: OrderSide) {
        let {asset, paymentToken} = params
        if (side == OrderSide.Buy) {
            asset = tokenToAsset(paymentToken)
        }
        if (asset.schemaName.toLowerCase() == 'erc721') {
            return this.userAccount.getAssetApprove(asset, this.erc721Delegate)
        } else {
            throw new Error("Not support" + asset.schemaName)
        }
    }

    async getMatchCallData(params: MatchParams)
        : Promise<{ callData: LimitedCallSpec, params: any }> {
        // metadata = '0x', takerAmount?: string, taker?: string
        const {orderStr} = params

        let callData: LimitedCallSpec, runParams
        const order: Order = JSON.parse(orderStr)
        if (order.side = OrderSide.Sell) {
            const items: {
                orderId: number
                currency: string
                price: string
            }[] = [{
                orderId: Number(order.id),
                price: order.price,
                currency: order.currency
            }]

            const payload = {
                "caller": this.walletInfo.address,
                "op": OP_COMPLETE_SELL_OFFER,
                "amountToEth": "0",
                "amountToWeth": "0",
                items
            }
            const inputs = await this.api.getRunInput(payload)
            const input = inputs[0].input
            const value = order.currency == NULL_ADDRESS ? order.price : "0"
            runParams = this.exchangeCoder.decodeInputParams("run", input)
            const txData = await this.exchange.populateTransaction.run(runParams.values.input, {value})
            callData = transactionToCallData(txData)
        } else {
            const items: {
                contract: string
                orderId: number
                royalty: number
                tokenId: string
            }[] = [{
                orderId: Number(order.id),
                royalty: 0,
                contract: order.token.contract,
                tokenId: order.token.token_id.toString()
            }]
            const payload = {
                "caller": this.walletInfo.address,
                "op": OP_COMPLETE_BUY_OFFER,
                "amountToEth": "0",
                "amountToWeth": "0",
                items
            }
            const inputs = await this.api.getRunInput(payload)
            const input = inputs[0].input
            runParams = this.exchangeCoder.decodeInputParams("run", input)
            const txData = await this.exchange.populateTransaction.run(runParams.values.input)
            callData = transactionToCallData(txData)
        }
        return {callData, params: runParams}
    }

    async createSellOrder(params: SellOrderParams): Promise<any> {
        const {asset, startAmount, quantity, expirationTime, buyerAddress,isCheckOrderApporve} = params
        const paymentToken = params.paymentToken || NullToken

        const accountAddress = this.walletInfo.address
        const {tokenAddress, tokenId} = asset
        if (isCheckOrderApporve) {
            const approve = await this.userAccount.getAssetApprove(asset, this.erc721Delegate)
            if (!approve.isApprove && approve.balances != "0" && approve.calldata) {
                const txWait = await this.userAccount.ethSend(approve.calldata)
                await txWait.wait()
            }
            if (approve.balances == "0") throw new Error("Token balance not enough")
        }


        if (!tokenId) throw new Error("Token id does not belong to you")
        const data = encodeItemData([{token: tokenAddress, tokenId}])
        const price = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals).toString()

        const deadline = expirationTime || oneDay

        const sellOrder: X2Y2Order = makeSellOrder(
            this.walletInfo.chainId,
            accountAddress,
            deadline,
            [{price, data}]
        )
        const orderHash = getOrderHash(sellOrder)
        const orderSign = await this.userAccount.signMessage(orderHash)
        const vrs = splitECSignature(orderSign)
        const order: X2Y2Order = {...sellOrder, v: vrs.v, r: vrs.r, s: vrs.s}

        const singSellOrder = {
            order: encodeOrder(order),
            bundleName: "",
            bundleDesc: "",
            orderIds: [],
            changePrice: false,
            isCollection: false,
            isBundle: false,
            taker: buyerAddress
        }

        return singSellOrder
    }

    async createBuyOrder(params: BuyOrderParams): Promise<any> {
        const {asset, startAmount, offerType, expirationTime} = params
        const paymentToken = params.paymentToken || this.GasWarpperToken

        const erc20 = tokenToAsset(paymentToken)
        const approve = await this.userAccount.getAssetApprove(erc20, this.exchange.address)
        if (!approve.isApprove && approve.balances != "0" && approve.calldata) {
            const txWait = await this.userAccount.ethSend(approve.calldata)
            await txWait.wait()
        }

        const accountAddress = this.walletInfo.address
        const {tokenAddress, tokenId} = asset

        if (approve.balances == "0") throw new Error("Unpaid payment token")

        const price = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals).toString()

        const isCollection = offerType == OfferType.ContractOffer

        const dataTokenId = isCollection ? '0' : tokenId ?? '0'
        const itemData = encodeItemData([
            {token: tokenAddress, tokenId: dataTokenId},
        ])

        // dataMask
        const mask = [
            {token: NULL_ADDRESS, tokenId: '0x' + '1'.repeat(64)},
        ]
        const dataMask = isCollection ? encodeItemData(mask) : '0x'

        const buyOrder: X2Y2Order = makeBuyOrder(
            this.walletInfo.chainId,
            accountAddress,
            paymentToken.address,
            expirationTime,
            dataMask,
            [{price, data: itemData}]
        )

        const orderHash = getOrderHash(buyOrder)
        const orderSign = await this.userAccount.signMessage(orderHash)
        const vrs = splitECSignature(orderSign)
        const order: X2Y2Order = {...buyOrder, v: vrs.v, r: vrs.r, s: vrs.s}

        return {
            order: encodeOrder(order),
            bundleName: "",
            bundleDesc: "",
            orderIds: [],
            changePrice: false,
            isCollection,
            isBundle: false
        }
    }

    async adjustOrder(params: AdjustOrderParams) {
        const order = JSON.parse(params.orderStr)
        let oldOrder = order
        if (order.id && order.price && order.nft) {
            oldOrder = {
                orderId: order.id,
                expirationTime: order.end_at,
                basePrice: order.price,
                tokenAddress: order.nft.token,
                tokenId: order.nft.token_id
            }
        }
        let {orderId, expirationTime, basePrice, tokenAddress, tokenId} = oldOrder

        const maker = this.walletInfo.address
        const oldPrice = ethers.BigNumber.from(basePrice)
        const newPrice = ethers.BigNumber.from(params.basePrice.toString())
        if (newPrice.gte(oldPrice)) {
            throw new Error('Must be lower than the current price.')
        }

        // const itemData =""
        const itemData = encodeItemData([{token: tokenAddress, tokenId}])
        if (Number(expirationTime) < twentyMinutes) {
            expirationTime = oneDay
        }

        const sellOrder: X2Y2Order = makeSellOrder(
            this.walletInfo.chainId,
            maker,
            expirationTime,
            [{price: params.basePrice, data: itemData}]
        )
        const orderHash = getOrderHash(sellOrder)
        const orderSign = await this.userAccount.signMessage(orderHash)
        const vrs = splitECSignature(orderSign)
        const newOrder: X2Y2Order = {...sellOrder, v: vrs.v, r: vrs.r, s: vrs.s}

        return {
            "order": encodeOrder(newOrder),
            "isBundle": false,
            "bundleName": "",
            "bundleDesc": "",
            "orderIds": [orderId],
            "changePrice": true,
            "isCollection": false
        }
    }

    async fulfillOrder(orderStr: string, option?: MatchOrderOption) {
        const {callData, params} = await this.getMatchCallData({orderStr})
        // console.log(callData, params)
        // return this.userAccount.estimateGas(callData)
        return this.userAccount.ethSend(callData)
    }

    async cancelOrders(orderIds: string[]) {
        const signMessage = ethers.utils.keccak256(this.walletInfo.address)
        const sign = await this.userAccount.signMessage(signMessage)
        const input = await this.api.getCancelInput({account: this.walletInfo.address, orderIds, sign, signMessage})
        const inputParams = input.substring(66, input.length)
        return this.userAccount.ethSend({
            from: this.walletInfo.address,
            to: this.exchange.address,
            data: "0x2295f9bf" + inputParams
        })

    }

    async postOrder(orderStr: string) {
        return this.api.postOrder(orderStr)
    }

    async getAssetsFees(assets: string[]) {
        const assetFees = await this.api.getAssets(assets)
        // "market_fee_rate": 5000,
        // "royalty_fee_rate": 0,
        return assets.map(val => {
            const fee = assetFees[val]
            return <FeesInfo>{
                royaltyFeeAddress: "",
                royaltyFeePoints: Math.round(fee.royalty_fee_rate / 100),
                protocolFeePoints: Math.round(fee.market_fee_rate / 100),
                protocolFeeAddress: ""
            }
        })

    }
}
