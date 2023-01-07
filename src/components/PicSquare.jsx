import React from 'react'
import styled from 'styled-components'
import { Button, Tag, Tooltip } from 'antd'
import { CaretLeftOutlined, CaretRightOutlined, PictureOutlined } from '@ant-design/icons'

const PicSquare = ({ picList, setPicList, pic, idx }) => {

    const movePic = (idx, delta) => {
        if(idx + delta >= 0 && idx + delta < picList.length){
            setPicList(picList.map((pic, i) => {
                if(i !== idx && i !== idx + delta){ return pic }
                else if(i === idx){ return picList[idx + delta] }
                else if(i === idx + delta){ return picList[idx] }
            }))
        }
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
            <img src={pic?.path} />
            <BtnWrapper>
                <div className="btn prevBtn" onClick={() => movePic(idx, -1)}>
                    <CaretLeftOutlined />
                </div>
                <Tooltip title="Marcar como imagen destacada">
                    <div className={`btn mainBtn ${pic.main ? "main" : ""}`} onClick={() => mainPic(idx)}>
                        <PictureOutlined />
                    </div>
                </Tooltip>
                <div className="btn nextBtn" onClick={() => movePic(idx, 1)}>
                    <CaretRightOutlined />
                </div>
            </BtnWrapper>
        </OuterWrapper>
    )
}

const OuterWrapper = styled.div`
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

export default PicSquare