export const addressesByNetwork = {
    1: {
        EXCHANGE: "0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3",
        RUN1: "0xf849de01b080adc3a814fabe1e2087475cf2e354",
        ERC721Delegate: "0xF849de01B080aDC3A814FaBE1E2087475cF2E354",
        WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        FeeAddress: "0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd"
    }
}
export const exchangeABI = [
    {
        "anonymous": false,
        "inputs": [{"indexed": true, "internalType": "bytes32", "name": "itemHash", "type": "bytes32"}, {
            "indexed": false,
            "internalType": "address",
            "name": "currency",
            "type": "address"
        }, {"indexed": false, "internalType": "address", "name": "to", "type": "address"}, {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
        }, {"indexed": false, "internalType": "uint256", "name": "incentive", "type": "uint256"}],
        "name": "EvAuctionRefund",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": true, "internalType": "bytes32", "name": "itemHash", "type": "bytes32"}],
        "name": "EvCancel",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "address", "name": "delegate", "type": "address"}, {
            "indexed": false,
            "internalType": "bool",
            "name": "isRemoval",
            "type": "bool"
        }],
        "name": "EvDelegate",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "uint256", "name": "index", "type": "uint256"}, {
            "indexed": false,
            "internalType": "bytes",
            "name": "error",
            "type": "bytes"
        }],
        "name": "EvFailure",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "uint256", "name": "newValue", "type": "uint256"}],
        "name": "EvFeeCapUpdate",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": true, "internalType": "bytes32", "name": "itemHash", "type": "bytes32"}, {
            "indexed": false,
            "internalType": "address",
            "name": "maker",
            "type": "address"
        }, {"indexed": false, "internalType": "address", "name": "taker", "type": "address"}, {
            "indexed": false,
            "internalType": "uint256",
            "name": "orderSalt",
            "type": "uint256"
        }, {"indexed": false, "internalType": "uint256", "name": "settleSalt", "type": "uint256"}, {
            "indexed": false,
            "internalType": "uint256",
            "name": "intent",
            "type": "uint256"
        }, {"indexed": false, "internalType": "uint256", "name": "delegateType", "type": "uint256"}, {
            "indexed": false,
            "internalType": "uint256",
            "name": "deadline",
            "type": "uint256"
        }, {
            "indexed": false,
            "internalType": "contract IERC20Upgradeable",
            "name": "currency",
            "type": "address"
        }, {
            "indexed": false,
            "internalType": "bytes",
            "name": "dataMask",
            "type": "bytes"
        }, {
            "components": [{"internalType": "uint256", "name": "price", "type": "uint256"}, {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }], "indexed": false, "internalType": "struct Market.OrderItem", "name": "item", "type": "tuple"
        }, {
            "components": [{"internalType": "enum Market.Op", "name": "op", "type": "uint8"}, {
                "internalType": "uint256",
                "name": "orderIdx",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "itemIdx", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            }, {"internalType": "bytes32", "name": "itemHash", "type": "bytes32"}, {
                "internalType": "contract IDelegate",
                "name": "executionDelegate",
                "type": "address"
            }, {"internalType": "bytes", "name": "dataReplacement", "type": "bytes"}, {
                "internalType": "uint256",
                "name": "bidIncentivePct",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "aucMinIncrementPct", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "aucIncDurationSecs",
                "type": "uint256"
            }, {
                "components": [{
                    "internalType": "uint256",
                    "name": "percentage",
                    "type": "uint256"
                }, {"internalType": "address", "name": "to", "type": "address"}],
                "internalType": "struct Market.Fee[]",
                "name": "fees",
                "type": "tuple[]"
            }], "indexed": false, "internalType": "struct Market.SettleDetail", "name": "detail", "type": "tuple"
        }],
        "name": "EvInventory",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "bytes32", "name": "itemHash", "type": "bytes32"}, {
            "indexed": false,
            "internalType": "address",
            "name": "currency",
            "type": "address"
        }, {"indexed": false, "internalType": "address", "name": "to", "type": "address"}, {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
        }],
        "name": "EvProfit",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "address", "name": "signer", "type": "address"}, {
            "indexed": false,
            "internalType": "bool",
            "name": "isRemoval",
            "type": "bool"
        }],
        "name": "EvSigner",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
        }, {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}],
        "name": "OwnershipTransferred",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "address", "name": "account", "type": "address"}],
        "name": "Paused",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "address", "name": "account", "type": "address"}],
        "name": "Unpaused",
        "type": "event"
    }, {
        "inputs": [],
        "name": "RATE_BASE",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32[]", "name": "itemHashes", "type": "bytes32[]"},
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            },
            {"internalType": "uint8", "name": "v", "type": "uint8"},
            {
                "internalType": "bytes32",
                "name": "r",
                "type": "bytes32"
            },
            {"internalType": "bytes32", "name": "s", "type": "bytes32"}],
        "name": "cancel",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "delegates",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "feeCapPct",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "uint256", "name": "feeCapPct_", "type": "uint256"}, {
            "internalType": "address",
            "name": "weth_",
            "type": "address"
        }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    }, {
        "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "name": "inventoryStatus",
        "outputs": [{"internalType": "enum Market.InvStatus", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "name": "ongoingAuctions",
        "outputs": [{"internalType": "uint256", "name": "price", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "netPrice",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "endAt", "type": "uint256"}, {
            "internalType": "address",
            "name": "bidder",
            "type": "address"
        }],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }, {"inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {
        "inputs": [],
        "name": "paused",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }, {"inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {
        "inputs": [{
            "components": [{
                "components": [{"internalType": "uint256", "name": "salt", "type": "uint256"}, {
                    "internalType": "address",
                    "name": "user",
                    "type": "address"
                }, {"internalType": "uint256", "name": "network", "type": "uint256"}, {
                    "internalType": "uint256",
                    "name": "intent",
                    "type": "uint256"
                }, {"internalType": "uint256", "name": "delegateType", "type": "uint256"}, {
                    "internalType": "uint256",
                    "name": "deadline",
                    "type": "uint256"
                }, {
                    "internalType": "contract IERC20Upgradeable",
                    "name": "currency",
                    "type": "address"
                }, {
                    "internalType": "bytes",
                    "name": "dataMask",
                    "type": "bytes"
                }, {
                    "components": [{
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    }, {"internalType": "bytes", "name": "data", "type": "bytes"}],
                    "internalType": "struct Market.OrderItem[]",
                    "name": "items",
                    "type": "tuple[]"
                }, {"internalType": "bytes32", "name": "r", "type": "bytes32"}, {
                    "internalType": "bytes32",
                    "name": "s",
                    "type": "bytes32"
                }, {"internalType": "uint8", "name": "v", "type": "uint8"}, {
                    "internalType": "uint8",
                    "name": "signVersion",
                    "type": "uint8"
                }], "internalType": "struct Market.Order[]", "name": "orders", "type": "tuple[]"
            }, {
                "components": [{
                    "internalType": "enum Market.Op",
                    "name": "op",
                    "type": "uint8"
                }, {"internalType": "uint256", "name": "orderIdx", "type": "uint256"}, {
                    "internalType": "uint256",
                    "name": "itemIdx",
                    "type": "uint256"
                }, {"internalType": "uint256", "name": "price", "type": "uint256"}, {
                    "internalType": "bytes32",
                    "name": "itemHash",
                    "type": "bytes32"
                }, {
                    "internalType": "contract IDelegate",
                    "name": "executionDelegate",
                    "type": "address"
                }, {"internalType": "bytes", "name": "dataReplacement", "type": "bytes"}, {
                    "internalType": "uint256",
                    "name": "bidIncentivePct",
                    "type": "uint256"
                }, {"internalType": "uint256", "name": "aucMinIncrementPct", "type": "uint256"}, {
                    "internalType": "uint256",
                    "name": "aucIncDurationSecs",
                    "type": "uint256"
                }, {
                    "components": [{
                        "internalType": "uint256",
                        "name": "percentage",
                        "type": "uint256"
                    }, {"internalType": "address", "name": "to", "type": "address"}],
                    "internalType": "struct Market.Fee[]",
                    "name": "fees",
                    "type": "tuple[]"
                }], "internalType": "struct Market.SettleDetail[]", "name": "details", "type": "tuple[]"
            }, {
                "components": [{"internalType": "uint256", "name": "salt", "type": "uint256"}, {
                    "internalType": "uint256",
                    "name": "deadline",
                    "type": "uint256"
                }, {"internalType": "uint256", "name": "amountToEth", "type": "uint256"}, {
                    "internalType": "uint256",
                    "name": "amountToWeth",
                    "type": "uint256"
                }, {"internalType": "address", "name": "user", "type": "address"}, {
                    "internalType": "bool",
                    "name": "canFail",
                    "type": "bool"
                }], "internalType": "struct Market.SettleShared", "name": "shared", "type": "tuple"
            }, {"internalType": "bytes32", "name": "r", "type": "bytes32"}, {
                "internalType": "bytes32",
                "name": "s",
                "type": "bytes32"
            }, {"internalType": "uint8", "name": "v", "type": "uint8"}],
            "internalType": "struct Market.RunInput",
            "name": "input",
            "type": "tuple"
        }], "name": "run", "outputs": [], "stateMutability": "payable", "type": "function"
    }, {
        "inputs": [{
            "components": [{"internalType": "uint256", "name": "salt", "type": "uint256"}, {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }, {"internalType": "uint256", "name": "network", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "intent",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "delegateType", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            }, {
                "internalType": "contract IERC20Upgradeable",
                "name": "currency",
                "type": "address"
            }, {"internalType": "bytes", "name": "dataMask", "type": "bytes"}, {
                "components": [{
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                }, {"internalType": "bytes", "name": "data", "type": "bytes"}],
                "internalType": "struct Market.OrderItem[]",
                "name": "items",
                "type": "tuple[]"
            }, {"internalType": "bytes32", "name": "r", "type": "bytes32"}, {
                "internalType": "bytes32",
                "name": "s",
                "type": "bytes32"
            }, {"internalType": "uint8", "name": "v", "type": "uint8"}, {
                "internalType": "uint8",
                "name": "signVersion",
                "type": "uint8"
            }], "internalType": "struct Market.Order", "name": "order", "type": "tuple"
        }, {
            "components": [{"internalType": "uint256", "name": "salt", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "amountToEth", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "amountToWeth",
                "type": "uint256"
            }, {"internalType": "address", "name": "user", "type": "address"}, {
                "internalType": "bool",
                "name": "canFail",
                "type": "bool"
            }], "internalType": "struct Market.SettleShared", "name": "shared", "type": "tuple"
        }, {
            "components": [{"internalType": "enum Market.Op", "name": "op", "type": "uint8"}, {
                "internalType": "uint256",
                "name": "orderIdx",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "itemIdx", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            }, {"internalType": "bytes32", "name": "itemHash", "type": "bytes32"}, {
                "internalType": "contract IDelegate",
                "name": "executionDelegate",
                "type": "address"
            }, {"internalType": "bytes", "name": "dataReplacement", "type": "bytes"}, {
                "internalType": "uint256",
                "name": "bidIncentivePct",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "aucMinIncrementPct", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "aucIncDurationSecs",
                "type": "uint256"
            }, {
                "components": [{
                    "internalType": "uint256",
                    "name": "percentage",
                    "type": "uint256"
                }, {"internalType": "address", "name": "to", "type": "address"}],
                "internalType": "struct Market.Fee[]",
                "name": "fees",
                "type": "tuple[]"
            }], "internalType": "struct Market.SettleDetail", "name": "detail", "type": "tuple"
        }],
        "name": "run1",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "signers",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address[]", "name": "toAdd", "type": "address[]"}, {
            "internalType": "address[]",
            "name": "toRemove",
            "type": "address[]"
        }], "name": "updateDelegates", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    }, {
        "inputs": [{"internalType": "uint256", "name": "val", "type": "uint256"}],
        "name": "updateFeeCap",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address[]", "name": "toAdd", "type": "address[]"}, {
            "internalType": "address[]",
            "name": "toRemove",
            "type": "address[]"
        }], "name": "updateSigners", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    }, {
        "inputs": [],
        "name": "weth",
        "outputs": [{"internalType": "contract IWETHUpgradable", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }, {"stateMutability": "payable", "type": "receive"}]
