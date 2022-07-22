import {Button, Col, Divider, message, Row, Space} from "antd";
import React, {useContext, useEffect, useState} from "react";
import {Context} from '../AppContext'

export function X2Y2SDK() {
    const {sdk} = useContext(Context);

    const x2y2CreateOrder = async () => {
        const order = await sdk.createSellOrder({
                asset: {
                    tokenAddress: "0x6d77496b7c143d183157e8b979e47a0a0180e86b",
                    tokenId: "1",
                    schemaName: "ERC721"
                },
                startAmount: 0.99
            }
        )
        const orderStr = JSON.stringify(order)
        message.success("x2y2 post order success")
    }
    const x2y2CancelOrder = async (nonce) => {
        const order = {exchangeData: JSON.stringify({nonce}), standard: "looksrare"}
        await sdk.cancelOrders([JSON.stringify(order)])
    }
    useEffect(() => {
        async function fetchOrder() {
            // await sdk.getLoginAuthToken()
            // const orders = await sdk.elementApi.getAccountOrders()
            // debugger
            // console.log(orders)
        }

        fetchOrder().catch(err => {
            message.error(err);
        })
    }, []);

    return (
        <>
            <Divider orientation={'left'}> X2Y2</Divider>
            <Space style={{marginLeft: 36}}>
                <Button type="primary" onClick={x2y2CreateOrder}>X2Y2CreateOrder</Button>
                <Button type="primary" onClick={x2y2CancelOrder}>LooksCancelOrder</Button>
            </Space>
        </>)
}



