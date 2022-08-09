import React from 'react'
import styled from 'styled-components'
import { Button } from 'antd'
import { Link } from 'react-router-dom'

const Container = ({ children }) => {
    return <div>
        <Header>
            <h3 style={{ margin: 0, padding: 0 }}>La buena feria</h3>
            <div>
                <Link to="/productos"><Button>Productos</Button></Link>
                <Link to="/eventos"><Button>Eventos</Button></Link>
            </div>
        </Header>
        <Body>
            { children }
        </Body>
    </div>
}

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #d7ffea;
    height: 40px;
    border-bottom: 1px solid gainsboro;
    box-shadow: 0px 2px 4px 1px rgba(0, 0, 0, 0.1);
    padding: 0 1em;
`
const Body = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 1em;
    width: calc(100% - 2em);
`

export default Container