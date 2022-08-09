import React from 'react'
import styled from 'styled-components'
import { Button, Tag } from 'antd'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'

const PackBtn = ({ product, pack, packItems, setPackItems }) => {
    const qty = packItems.filter(it => it === product?.id)?.length

    return (
        <Wrapper>
            <Qty><Tag>{ qty }</Tag></Qty>

            { product.name }

            <BtnWrap>
                <Button 
                    disabled={packItems?.length < 0}
                    size='small' 
                    onClick={() => {
                        const idx = packItems.findIndex(it => it === product.id)
                        setPackItems(packItems.filter((it, i) => i !== idx))
                    }}
                >
                    <MinusOutlined />
                </Button>
                <Button 
                    disabled={packItems?.length >= pack?.units}
                    size='small' 
                    onClick={() => {
                        setPackItems([
                            ...packItems,
                            product.id
                        ])
                    }}
                >
                    <PlusOutlined />
                </Button>
            </BtnWrap>
        </Wrapper>
    )
}

const Wrapper = styled.div`
    width: 110px;
    height: 110px;
    border-radius: 4px;
    border: 1px solid gainsboro;
    margin: 4px;
    position: relative;
    padding: 1em;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

`

const Qty = styled.div`
    position: absolute;
    top: -6px;
    right: -14px;
`

const BtnWrap = styled.div`
    display: flex;
    justify-content: space-evenly;
`

export default PackBtn