import React from 'react'
import styled from 'styled-components'
import { Button, Tag, Tooltip } from 'antd'
import { CaretLeftOutlined, CaretRightOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons'

const PicSquare = ({ picList, setPicList, pic, idx, destacada }) => {

    const movePic = (idx, delta) => {
        if(idx + delta >= 0 && idx + delta < picList.length){
            setPicList(picList.map((pic, i) => {
                if(i !== idx && i !== idx + delta){ return pic }
                else if(i === idx){ return picList[idx + delta] }
                else if(i === idx + delta){ return picList[idx] }
            }))
        }
    }

    const deletePic = () => {
        setPicList(picList.filter((p, i) => idx !== i))
    }

    const mainPic = idx => {
        setPicList(picList.map((pic, i) => {
            return {
                ...pic,
                main: i === idx
            }
        }))
    }

    return (
        <OuterWrapper main={pic?.main}>
            <DeleteBtn onClick={() => deletePic()}>
                <DeleteOutlined />
            </DeleteBtn>
            <div style={{ position: "absolute", top: 0, left: 0 }}>
                <img src={pic?.path || pic?.url} />
                <BtnWrapper>
                    <div className="btn prevBtn" onClick={() => movePic(idx, -1)}>
                        <CaretLeftOutlined />
                    </div>
                    { destacada && (
                        <Tooltip title="Marcar como imagen destacada">
                            <div className={`btn mainBtn ${pic.main ? "main" : ""}`} onClick={() => mainPic(idx)}>
                                <PictureOutlined />
                            </div>
                        </Tooltip>
                    )}
                    <div className="btn nextBtn" onClick={() => movePic(idx, 1)}>
                        <CaretRightOutlined />
                    </div>
                </BtnWrapper>
            </div>
        </OuterWrapper>
    )
}

const OuterWrapper = styled.div`
    position: relative;
    width: 100px;
    height: calc(100px + 2em);
    border: 1px solid ${({ main }) => main ? "red" : "gainsboro"};
    border-radius: 4px;
    overflow: hidden;
    margin: 0 1em 1em 0;
    img{
        width: 100px;
        height: 100px;
        object-fit: cover;
    }
`

const BtnWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 2em;
    .btn{
        flex: 1;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 300ms;
        &:hover{
            background-color: gainsboro;
        }
        &.main svg{
            color: lightgray;
        }
    }
`

const DeleteBtn = styled.div`
    position: absolute;
    z-index: 123;
    top: 0;
    right: 0;
    padding: 0 5px;
    cursor: pointer;
    border-radius: 0 0 0 3px;
    background-color: rgba(255,255,255,0.8);
`

export default PicSquare