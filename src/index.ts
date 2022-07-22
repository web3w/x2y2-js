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
import {encodeItemData, encodeOrder, getOrderHash, makeBuyOrder, makeSellOrder} from "./utils";
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

    // 初始化SDK
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
            const inputs = await this.api.getRunInput({account: this.walletInfo.address, items})
            const input = inputs[0].input
            const value = order.currency == NULL_ADDRESS ? order.price : "0"
            runParams = this.exchangeCoder.decodeInputParams("run", input)
            const txData = await this.exchange.populateTransaction.run(runParams.values.input, {value})
            callData = transactionToCallData(txData)
        } else {
            callData = {
                value: "0",
                to: this.exchange.address,
                data: "0x357a150b"
            }
        }

        return {callData, params: runParams}
    }

    async createSellOrder(params: SellOrderParams): Promise<any> {
        const {asset, startAmount, quantity, expirationTime, buyerAddress} = params
        const paymentToken = params.paymentToken || NullToken

        const accountAddress = this.walletInfo.address
        const {tokenAddress, tokenId} = asset
        const approve = await this.userAccount.getAssetApprove(asset, this.erc721Delegate)
        if (!approve.isApprove && approve.balances != "0" && approve.calldata) {
            const txWait = await this.userAccount.ethSend(approve.calldata)
            await txWait.wait()
        }

        if (!tokenId || approve.balances == "0") throw new Error("Token id does not belong to you")
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

// 0x357a150b0000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000048000000000000000000000000000000000000000000000000000000e1048d95b490000000000000000000000000000000000000000000000000000000062db47e30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000032f4b63a46c1d12ad82cabc778d75abf9889821a0000000000000000000000000000000000000000000000000000000000000000f4bdaa828486c90c2339df8aef0050983ff8ee4cbebf5aa4bc743b0889ff21aa210a322a53676a07f1fff839f0745bed0e27bb25c0870282afc71eb04b7e55de000000000000000000000000000000000000000000000000000000000000001b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000010b52f04ca799f35a50f20ae9915a5700000000000000000000000020e30b5a64960a08dfb64beb8ab65d860cd71da70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000062dc444d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001c0d2227997e171d158a2be9e0c363fd5d48a806a5e6d51693938314ec1d83df6623688cad94b996edd75ee81808d2c29e1a14de3c28a8433c31a5fe53916ec9103000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000006d77496b7c143d183157e8b979e47a0a0180e86b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002386f26fc1000000267d23adff2bd14394420f45abef0e7a661b2c39fdb8275f82eb4a62fa4b2f2000000000000000000000000f849de01b080adc3a814fabe1e2087475cf2e35400000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000001388000000000000000000000000d823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd

// 0x357a150b00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000048000000000000000000000000000000000000000000000000000015b63564684ef0000000000000000000000000000000000000000000000000000000062db48030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000032f4b63a46c1d12ad82cabc778d75abf9889821a000000000000000000000000000000000000000000000000000000000000000098c618b1a33893068ac75f2dda4209933968351f5f3f9a5f405826a0c49b4967708850cc294dc92d1d7d0d7264c61e772d468101268bb7173c9a37acf592775c000000000000000000000000000000000000000000000000000000000000001b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000010b52f04ca799f35a50f20ae9915a5700000000000000000000000020e30b5a64960a08dfb64beb8ab65d860cd71da70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000062dc444d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001c0d2227997e171d158a2be9e0c363fd5d48a806a5e6d51693938314ec1d83df6623688cad94b996edd75ee81808d2c29e1a14de3c28a8433c31a5fe53916ec9103000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000006d77496b7c143d183157e8b979e47a0a0180e86b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002386f26fc1000000267d23adff2bd14394420f45abef0e7a661b2c39fdb8275f82eb4a62fa4b2f2000000000000000000000000f849de01b080adc3a814fabe1e2087475cf2e35400000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000001388000000000000000000000000d823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd
