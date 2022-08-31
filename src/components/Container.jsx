import React from 'react'
import styled from 'styled-components'
import { Button, Dropdown, Menu } from 'antd'
import { Link } from 'react-router-dom'
import { useHistory } from 'react-router-dom'
import { useAuthentication } from '../context/authentication'
import { MenuOutlined } from '@ant-design/icons'

const Container = ({ children }) => {
    const history = useHistory()
    const { doLogout, user } = useAuthentication()

    const logout = async () => {
      await doLogout();
      history.push("/login");
    };

    return (
        <div>
            <Header>
                <h3 style={{ margin: 0, padding: 0 }}>La buena feria</h3>
                {/* <div>
                    <Link to="/productos"><Button>Productos</Button></Link>
                    <Link to="/eventos"><Button>Eventos</Button></Link>
                    <Link to="/reservas"><Button>Reservas</Button></Link>
                </div> */}
                <Dropdown
                    trigger={['click']}
                    overlay={
                        <div>
                            <div style={{ width: "100%", padding: 4, backgroundColor: "#fafafa" }}>
                                <small style={{ color: "gray" }}>Estás logueado como {user.email}</small>
                            </div>
                            <Menu
                                items={[
                                    {
                                        label: <Link to="/">Inicio</Link>,
                                        key: '-1',
                                    },
                                    {
                                        label: <Link to="/productos">Productos</Link>,
                                        key: '0',
                                    },
                                    {
                                        label: <Link to="/eventos">Eventos</Link>,
                                        key: '1',
                                    },
                                    {
                                        label: <Link to="/reservas">Reservas</Link>,
                                        key: '2',
                                    },
                                    {
                                        type: 'divider',
                                    },
                                    {
                                        label: <span onClick={() => logout()}>Cerrar sesión</span>,
                                        key: '3',
                                    },
                                ]}
                            />
                        </div>
                    }
                >
                    <Button><MenuOutlined /></Button>
                </Dropdown>
            </Header>
            <Body>
                { children }
            </Body>
        </div>
    )
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