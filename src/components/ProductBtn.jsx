import React from 'react'
import styled from 'styled-components'
import { Button, Tag } from 'antd'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import _ from 'lodash'

const ProductBtn = ({ product, mutateStatus, qty, modalPack, setModalPack }) => {
    const firstTag = _.get(product, "tags[0]", "") 
    const color = firstTag ? ([...firstTag].reduce((acc, it) => acc * it.charCodeAt(), 123123) % 16777215).toString(16) : "FFFFFF"
    return (
        <Wrapper color={"#" + color}>
            <Qty>
                {!!qty && <Tag>{ qty?.qty || qty }</Tag>}
            </Qty>

            <p style={{
                textShadow: "0px 0px 8px white",
                fontWeight: "bold",
                marginBottom: "6px"
            }}>{ product.name }</p>
            {(qty?.qty || qty) > 0 && <strong>{(qty?.qty || qty) * product.price }€</strong> }

            <BtnWrap>
                <Button 
                    disabled={qty < 1}
                    size='small' 
                    onClick={() => mutateStatus(product.id, -1, !!modalPack)}
                >
                    <MinusOutlined />
                </Button>
                <Button 
                    size='small' 
                    onClick={() => {
                        if(modalPack){
                            setModalPack({
                                visible: true,
                                pack: product
                            })
                        } else {
                            mutateStatus(product.id, 1)
                        }
                    }}
                >
                    <PlusOutlined />
                </Button>
            </BtnWrap>
        </Wrapper>
    )
}

const Wrapper = styled.div`
    width: 105px;
    height: 140px;
    border-radius: 4px;
    border: 1px solid gainsboro;
    margin: 4px;
    position: relative;
    padding: 1em;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: ${({ color }) => color};

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

export default ProductBtn