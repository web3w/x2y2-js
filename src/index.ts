// 一口价购买
import {
    exchangeABI,
    addressesByNetwork
} from "./config";
import EventEmitter from 'events'
import {Contract, ethers, utils} from "ethers"
import {
    AdjustOrderParams,
    APIConfig, Asset,
    BuyOrderParams,
    CreateOrderParams,
    ElementSchemaName, ETHToken,
    ExchangetAgent, FeesInfo,
    MatchOrderOption,
    MatchOrdersParams,
    MatchParams,
    OrderSide,
    SellOrderParams, tokenToAsset,
} from 'web3-accounts'
import {LimitedCallSpec, splitECSignature, WalletInfo} from 'web3-wallets'
import {Web3Accounts, X2Y2Order} from "./types";
import {X2Y2API} from "./api";
import {decodeItemData, decodeOrder, encodeItemData, encodeOrder, getOrderHash, makeSellOrder} from "./utils";
import {Web3ABICoder} from "web3-abi-coder";


export class X2Y2SDK extends EventEmitter implements ExchangetAgent {
    public contracts: any
    public userAccount: Web3Accounts
    public walletInfo: WalletInfo
    public api: X2Y2API
    public contractAddresses: any
    public exchange: Contract
    public erc721Delegate: string
    public exchangeCoder: Web3ABICoder

    // 初始化SDK
    constructor(wallet: WalletInfo, config?: APIConfig) {
        super()
        this.userAccount = new Web3Accounts(wallet)
        this.api = new X2Y2API({...config, chainId: wallet.chainId})
        this.walletInfo = wallet
        const contractAddresses = addressesByNetwork[wallet.chainId]
        this.contractAddresses = contractAddresses
        this.exchange = new Contract(contractAddresses.EXCHANGE, exchangeABI, this.userAccount.signer)
        this.erc721Delegate = contractAddresses.ERC721Delegate
        this.exchangeCoder = new Web3ABICoder(exchangeABI)
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
        const {asset, startAmount, quantity, expirationTime, paymentToken, buyerAddress} = params
        const accountAddress = this.walletInfo.address
        const {tokenAddress, tokenId} = asset
        const ERC721Delegate = this.erc721Delegate
        const approve = await this.userAccount.getERC721Approved(tokenAddress, this.erc721Delegate)
        if (!approve) {
            const txWait = await this.userAccount.approveERC721Proxy(tokenAddress, ERC721Delegate)
            await txWait.wait()
        }

        if (!tokenId) throw new Error("Token id undefined")
        const data = encodeItemData([{token: tokenAddress, tokenId}])
        const price = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals).toString()
        const sellOrder: X2Y2Order = makeSellOrder(
            this.walletInfo.chainId,
            accountAddress,
            expirationTime,
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

        // royalties: [],
        // isPrivate: false,
        // taker: null,

        return singSellOrder
    }

    async createBuyOrder(order: BuyOrderParams): Promise<any> {

    }

    async adjustOrder(params: AdjustOrderParams) {
        const oldOrderParams = JSON.parse(params.orderStr)
        const oldOrder = decodeOrder(oldOrderParams.order)[0]
        const item = oldOrder.items[0]
        const {token, tokenId} = decodeItemData(item.data)[0][0]

        const maker = this.walletInfo.address
        const list = await this.api.getOrders({maker, tokenAddress: token, tokenId: tokenId.toString()})

        // const oldPrice = item.price
        // const newPrice = ethers.BigNumber.from(params.basePrice)
        // if (newPrice.gte(oldPrice)) {
        //     throw new Error('Must be lower than the current price.')
        // }
        const sellOrder: X2Y2Order = makeSellOrder(
            this.walletInfo.chainId,
            maker,
            params.expirationTime ?? parseInt(oldOrder.deadline),
            [{price: params.basePrice, data: item.data}]
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
            "orderIds": [
                list.orders[0].id
            ],
            "changePrice": true,
            "isCollection": false
        }
        // return this.api.postOrder(oderData)
    }

    async fulfillOrder(orderId: string, option?: MatchOrderOption) {
        // const orderId = 5226088// res.orders[0].id;
        const price = ethers.utils.parseEther("0.11").toString()
        const inputs = await this.api.getOrderSign({account: this.walletInfo.address, orderId: Number(orderId), price})
        const runParams = this.exchangeCoder.decodeInputParams("run", inputs[0].input)
    }

    async fulfillOrders(orders: MatchOrdersParams) {

    }

    async cancelOrders(nonces: string[]) {
        if (nonces.length == 0) {
            throw new Error('LooksRare  cancelOrders eq 0')
        }
        return this.exchange.cancelMultipleMakerOrders(nonces)
    }

    async cancelAllOrders(nonec?: string) {
        const minNonce = nonec || await this.exchange.userMinOrderNonce(this.walletInfo.address)
        return this.exchange.cancelAllOrdersForSender(minNonce)
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

