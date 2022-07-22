// 一口价购买
import {
    exchangeABI,
    addressesByNetwork
} from "./config";
import EventEmitter from 'events'
import {BigNumber, Contract, ethers, utils} from "ethers"
import {
    AdjustOrderParams,
    APIConfig, Asset,
    BuyOrderParams,
    CreateOrderParams,
    ElementSchemaName, ETHToken,
    ExchangetAgent, FeesInfo,
    MatchOrderOption,
    MatchOrdersParams,
    MatchParams, NullToken,
    OrderSide,
    SellOrderParams, Token, tokenToAsset,
} from 'web3-accounts'
import {LimitedCallSpec, splitECSignature, WalletInfo} from 'web3-wallets'
import {Web3Accounts, X2Y2Order} from "./types";
import {X2Y2API} from "./api";
import {
    decodeItemData,
    decodeOrder,
    encodeItemData,
    encodeOrder,
    getOrderHash,
    makeSellOrder
} from "./utils";
import {Web3ABICoder} from "web3-abi-coder";
import pkg from '../package.json'

const oneDay = Math.round((Date.now() / 1000 + (3600 + 240)))
const twentySeconds = Math.round(Date.now() / 1000 + 900)

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
        const {orderStr, metadata = '0x', assetRecipientAddress} = params
        const data = await this.contracts.orderMatchCallData(orderStr, {metadata, taker: assetRecipientAddress})


        const callData: LimitedCallSpec = {
            value: data?.value ? data.value?.toString() : '0',
            data: data?.data || "",
            to: data?.to || ""
        }
        return {callData, params: {}}
    }

    async createSellOrder(params: SellOrderParams): Promise<any> {
        const {asset, startAmount, quantity, expirationTime, buyerAddress} = params
        const paymentToken = params.paymentToken || NullToken

        const accountAddress = this.walletInfo.address
        const {tokenAddress, tokenId} = asset
        const ERC721Delegate = this.erc721Delegate
        const approve = await this.userAccount.getAssetApprove(asset, this.erc721Delegate)
        if (!approve.isApprove && approve.balances != "0") {
            const txWait = await this.userAccount.approveERC721Proxy(tokenAddress, ERC721Delegate)
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
        const order = {...sellOrder, v: vrs.v, r: vrs.r, s: vrs.s}

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
        const paymentToken = params.paymentToken || this.GasWarpperToken
    }

    async adjustOrder(params: AdjustOrderParams) {
        let {orderId, expirationTime, basePrice, tokenAddress, tokenId} = JSON.parse(params.orderStr)

        const maker = this.walletInfo.address
        const oldPrice = ethers.BigNumber.from(basePrice)
        const newPrice = ethers.BigNumber.from(params.basePrice)
        if (newPrice.gte(oldPrice)) {
            throw new Error('Must be lower than the current price.')
        }

        // const itemData =""
        const itemData = encodeItemData([{token: tokenAddress, tokenId}])
        if (Number(expirationTime) < twentySeconds) {
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
        const order = {...sellOrder, v: vrs.v, r: vrs.r, s: vrs.s}

        return {
            "order": encodeOrder(order),
            "isBundle": false,
            "bundleName": "",
            "bundleDesc": "",
            "orderIds": [orderId],
            "changePrice": true,
            "isCollection": false
        }
        // return this.api.postOrder(oderData)
    }

    async fulfillOrder(orderId: string, option?: MatchOrderOption) {
        // const orderId = 5226088// res.orders[0].id;
        const price = ethers.utils.parseEther("0.11").toString()
        const items: {
            orderId: number
            currency: string
            price: string
        }[] = [{
            orderId: Number(orderId),
            price,
            "currency": "0x0000000000000000000000000000000000000000"
        }]
        const inputs = await this.api.getRunInput({account: this.walletInfo.address, items})
        const inputParams = inputs[0].input
        const runParams = this.exchangeCoder.decodeInputParams("run", inputParams)
        this.userAccount.ethSend({
            from: this.walletInfo.address,
            to: this.exchange.address,
            data: "0x357a150b" + inputParams.substring(10, inputParams.length)
        })
    }

    async fulfillOrders(orders: MatchOrdersParams) {

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

    async cancelAllOrders(nonce?: string) {

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

