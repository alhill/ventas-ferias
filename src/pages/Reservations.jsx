import { Button, Modal, Input, Table, Tag, Form, Select, message, DatePicker, Switch, Collapse } from 'antd'
import { collection, query, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react'
import { Container } from '../components'
import { useFirebase } from '../context/firebase';
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, ExportOutlined, EyeOutlined, GiftOutlined, UserOutlined } from '@ant-design/icons'
import _ from 'lodash';
import estaSeguroDeQue from '../utils/estaSeguroDeQue';
import { useHistory, Link } from 'react-router-dom';
import moment from 'moment'
import { basicSorter, cleanStr } from '../utils';
import styled from 'styled-components';

const Reservations = () => {
    const { firestore } = useFirebase()
    const history = useHistory()

    const [mutateModal, setMutateModal] = useState({ visible: false })
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(false)
    const [showCompleted, setShowCompleted] = useState(false)
    const [filteredReservations, setFilteredReservations] = useState([])
    const [products, setProducts] = useState([])
    const [pendingProducts, setPendingProducts] = useState([])
    const [detailModal, setDetailModal] = useState({ visible: false })
    const [deliverModal, setDeliverModal] = useState({ visible: false })
    const [searchName, setSearchName] = useState("")
    const [searchProduct, setSearchProduct] = useState("") 

    useEffect(() => {
        const unsubscribeProducts = onSnapshot(
            query(collection(firestore, "products")),
            qs => {
                const products = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setProducts(products)
            }
        );

        
        const unsubscribeReservations = onSnapshot(
            query(collection(firestore, "reservations")),
            qs => {
                const reservations = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))

                const pendingProducts = Object.values(_.groupBy(reservations.map(r => r.items).flat(), "id")).map(product => {
                    const totalQty = product.reduce((acc, it) => acc + (it?.qty || 0) - (it?.delivered || 0), 0)
                    return {
                        ...product[0],
                        qty: totalQty
                    }
                }).filter(it => it.qty > 0)
                setPendingProducts(pendingProducts)
                setReservations(reservations)
            }
        )
        return () => unsubscribeReservations()
    }, [])

    useEffect(() => {
        setFilteredReservations((reservations || [])
            .filter(r => r.completed === showCompleted)
            .filter(r => cleanStr(r?.name || "").includes(cleanStr(searchName)) || !searchName)
            .filter(r => {
                const populatedItems = (r?.items || []).map(it => (products || []).find(p => p.id === it.id))
                const itemNames = (populatedItems || []).map(pit => cleanStr(pit.name || ""))
                return itemNames.some(itn => itn.includes(cleanStr(searchProduct || ""))) || !searchProduct
            })
        )
    }, [reservations, showCompleted, searchName, searchProduct])

    const [form] = Form.useForm()

    // const createReservation = async () => {
    //     try{
    //         setLoading(true)
    //         const { name, date } = form.getFieldsValue(true)
    //         const added = await addDoc(collection(firestore, "reservations"), {
    //             name,
    //             date: date.toDate()
    //         })
    //         setMutateModal({ visible: false })
    //         message.success("La reserva se ha creado correctamente")
    //         setLoading(false)
    //     } catch(err) {
    //         console.log(err)
    //         message.error("Ocurrió un error durante la creación de la reserva")
    //         setLoading(false)
    //     }
    // }
    // const updateReservation = async id => {
    //     try{
    //         setLoading(true)
    //         const { name, date } = form.getFieldsValue(true)
    //         const updated = await setDoc(doc(firestore, "reservations", id), {
    //             name,
    //             date: date.toDate()
    //         })
    //         setMutateModal({ visible: false })
    //         message.success("La reserva se ha editado correctamente")
    //     } catch(err) {
    //         console.log(err)
    //         message.error("Ocurrió un error durante la edición de la reserva")
    //         setLoading(false)
    //     }
    // }
    const deleteReservation = async id => {
        try{
            const deleted = await deleteDoc(doc(firestore, "reservations", id))
            message.success("La reserva se ha eliminado correctamente")
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante el borrado de la reserva")
            setLoading(false)
        }
    }

    const columns = [
        {
            title: "Nombre",
            key: "name",
            sorter: (a, b) => basicSorter(a?.name, b?.name),
            className: "nameCol",
            render: item => {
                return (
                    <p 
                        onClick={() => {
                            setDeliverModal({ 
                                visible: true, 
                                item,
                                totalPrice: (item?.items || []).reduce((acc, it) => {
                                    return acc + (parseInt(it.qty) * parseFloat(it.price))
                                }, 0)
                            })
                        }}
                        style={{ width: "100%", margin: 0, padding: "1em", cursor: "pointer" }}
                    >{ item.name }</p>
                )
            }
        },
        // {
        //     title: "Forma de contacto",
        //     dataIndex: "reservationMethod",
        //     key: "reservationMethod",
        //     sorter: (a, b) => basicSorter(a?.reservationMethod, b?.reservationMethod)
        // },
        // {
        //     title: "Dirección/Número",
        //     dataIndex: "address",
        //     key: "address",
        //     sorter: (a, b) => basicSorter(a?.address, b?.address)
        // },
        {
            title: "Fecha de reserva",
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: (a, b) => {
                const aDate = a.createdAt.toDate()
                const bDate = b.createdAt.toDate()
                return basicSorter(aDate, bDate)
            },
            render: it => moment(it.toDate()).format("DD-MM-YYYY HH:mm")
        },
        {
            title: "Productos" + (!showCompleted ? " pendientes" : ""),
            key: "products",
            render: res => (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {(res.items || []).filter(it => {
                        return showCompleted || (it.qty > (it.delivered || 0))
                    }).map(it => {
                        const name = (products || []).find(prod => prod.id === it.id)?.name
                        return <span key={`item-${res.id}-${it.id}`}>{showCompleted ? it.qty : (parseInt(it.qty) - parseInt(it.delivered || 0))}x {name}</span>
                    })}
                </div>
            )
        },
        {
            title: "Opciones",
            render: item => {
                return (
                    <div style={{ display: "flex" }}>
                        <Tag
                            onClick={() => {
                                setDetailModal({
                                    visible: true,
                                    item
                                })
                            }}
                        ><EyeOutlined /></Tag>
                        &nbsp;
                        <Tag onClick={() => {
                            setDeliverModal({ 
                                visible: true, 
                                item,
                                totalPrice: (item?.items || []).reduce((acc, it) => {
                                    return acc + (parseInt(it.qty) * parseFloat(it.price))
                                }, 0)
                            })
                        }}><ExportOutlined /></Tag>
                        &nbsp;
                        { !item?.completed && (
                            <Tag 
                                color="volcano"
                                onClick={() => {
                                    estaSeguroDeQue({
                                        desea: "eliminar",
                                        esto: `la reserva de ${item.name}`,
                                        loading,
                                        fn: async () => {
                                            setLoading(true)
                                            await deleteReservation(item.id)
                                            setLoading(false)
                                        }
                                    })
                                }}
                            ><DeleteOutlined /></Tag>
                        )}
                    </div>
                )
            }
        }
    ]

    const productColumns = [
        {
            title: "Nombre",
            key: "name",
            sorter: (a, b) => {
                const aName = (products || []).find(prod => prod.id === a.id)?.name
                const bName = (products || []).find(prod => prod.id === b.id)?.name
                basicSorter(aName, bName)
            },
            render: p => {
                const relatedProduct = (products || []).find(prod => prod?.id === p?.id)
                return relatedProduct?.name
            }
        },
        {
            title: "Número de unidades",
            key: "qty",
            dataIndex: "qty",
            sorter: (a, b) => basicSorter(a, b, "qty" )
        }
    ]

    const deliverProducts = async ({ reservation, deliveredProducts, complete }) => {
        if(complete){
            estaSeguroDeQue({
                desea: "entregar",
                esto: "el pedido completo",
                fn: async () => {
                    const itemsMod = reservation.items.map(it => {
                        return {
                            ...it,
                            delivered: it.qty
                        }
                    })
                    await updateDoc(doc(firestore, "reservations", reservation.id), {
                        items: itemsMod,
                        completed: true
                    })
                    setDeliverModal({ visible: false })
                }
            })
        }
        else {
            estaSeguroDeQue({
                desea: "entregar",
                esto: "los productos seleccionados",
                fn: async () => {
                    if(!deliveredProducts || (Array.isArray(deliveredProducts) && deliveredProducts.every(dp => dp.qty === 0 || dp.qty === "0"))){
                        message.error("No hay ningún producto marcado para entregar (todas las cantidades son cero)")
                    }
                    else if(deliveredProducts.some(dp => dp.qty < 0)){
                        message.error("La cantidad de producto no puede ser inferior a cero")
                    }
                    else {
                        const itemsMod = reservation.items.map(it => {
                            const thisTimeDelivered = deliveredProducts.find(dp => dp.id === it.id)?.qty || 0
                            return {
                                ...it,
                                delivered: parseInt(it.delivered || 0) + parseInt(thisTimeDelivered)
                            }
                        })
                        if(itemsMod.some(it => it.qty < it.delivered)){
                            message.error("La cantidad de productos entregados supera la cantidad reservada")
                        }
                        else{
                            const completed = itemsMod.every(it => parseInt(it.qty) === parseInt(it.delivered))
                            await updateDoc(doc(firestore, "reservations", reservation.id), {
                                items: itemsMod,
                                completed
                            })
                            setDeliverModal({ visible: false })
                        }
                    }
                }
            })
        }
    }

    return (
        <Container>
            <h2>Reservas</h2>
            {/* <Button
                onClick={async () => {
                    reservations.forEach(async res => {
                        await updateDoc(doc(firestore, "reservations", res.id), {
                            assignedTo: "SeMajIbTHTrIGTPdjc4D"
                        })
                    })
                }}
            >
                boton misterio
            </Button> */}
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <div>
                    <Link to="/nueva-reserva"><Button>Crear reserva</Button></Link>
                    &nbsp;&nbsp;
                    <Button onClick={() => setShowCompleted(!showCompleted)}>Mostrar { showCompleted ? "sin completar" : "completadas"}</Button>
                </div>
            </div>
            <br />
            <div style={{ display: "flex", justifyContent: "space-evenly", width: "100%" }}>
                <Input 
                    placeholder="Buscar por nombre"
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    allowClear
                    prefix={<UserOutlined style={{ color: "#d9d9d9" }}/>}
                />
                <Input 
                    placeholder="Buscar por producto"
                    value={searchProduct}
                    onChange={e => setSearchProduct(e.target.value)}
                    allowClear
                    prefix={<GiftOutlined style={{ color: "#d9d9d9" }} />}
                />
            </div>

            <br />

            <div style={{ width: "100%", overflowX: "auto" }}>
                <Modifier>
                    <Table
                        dataSource={filteredReservations}
                        rowKey="id"
                        columns={columns}
                    />
                </Modifier>
            </div>

            <br />
            
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <h2>Productos pendientes de entrega</h2>
            </div>

            <div
                style={{ width: "100%", overflowX: "auto" }}
            >
                <Table
                    dataSource={pendingProducts}
                    rowKey="id"
                    columns={productColumns}
                />
            </div>

            <Modal
                visible={detailModal?.visible}
                footer={null}
                onCancel={() => setDetailModal({ visible: false })}
            >
                <p><string><strong>Nombre:</strong> {detailModal?.item?.name}</string></p>
                <p><string><strong>Forma de contacto:</strong> {detailModal?.item?.reservationMethod}</string></p>
                <p><string><strong>Dirección/Número:</strong> {detailModal?.item?.address}</string></p>
                { detailModal?.item?.observations && <p><string><strong>Observaciones:</strong> {detailModal?.item?.observations}</string></p> }

                <h4>Productos</h4>
                <Table
                    columns={[
                        {
                            title: "Nombre",
                            key: "name",
                            sorter: (a, b) => {
                                const aName = (products || []).find(prod => prod.id === a.id)?.name
                                const bName = (products || []).find(prod => prod.id === b.id)?.name
                                basicSorter(aName, bName)
                            },
                            render: p => {
                                const relatedProduct = (products || []).find(prod => prod?.id === p?.id)
                                return relatedProduct?.name
                            }
                        },
                        {
                            title: "Cantidad",
                            dataIndex: "qty",
                            key: "qty",
                            sorter: (a, b) => basicSorter(a, b, "qty")
                        },
                    ]}
                    dataSource={detailModal?.item?.items || []}
                />
                <Button onClick={() => setDetailModal({ visible: false })}>Cerrar</Button>
            </Modal>

            <Modal
                visible={deliverModal?.visible}
                footer={null}
                onCancel={() => setDeliverModal({ visible: false })}
            >
                <h4>Entrega de productos</h4>
                <div style={{ width: "100%", overflowX: "auto" }}>
                    <Table
                        columns={[
                            {
                                title: "Nombre",
                                key: "name",
                                render: p => {
                                    const relatedProduct = (products || []).find(prod => prod?.id === p?.id)
                                    return relatedProduct?.name
                                }
                            },
                            {
                                title: "Cantidad",
                                dataIndex: "qty",
                                key: "qty",
                                sorter: (a, b) => basicSorter(a, b, "qty")
                            },
                            {
                                title: "Entregadas",
                                dataIndex: "delivered",
                                key: "delivered",
                                sorter: (a, b) => basicSorter(a, b, "delivered"),
                                render: n => n || 0
                            },
                            {
                                title: "Se entregan",
                                key: "deliveredQty",
                                render: item => {
                                    return (
                                        <Input
                                            type="number"
                                            value={(deliverModal?.deliverQtys || []).find(dq => dq.id === item.id)?.qty || 0}
                                            onChange={evt => {
                                                const deliverModalMod = {
                                                    ...deliverModal,
                                                    deliverQtys: [
                                                        ...(deliverModal.deliverQtys || []).filter(dq => dq.id !== item.id),
                                                        {
                                                            id: item.id,
                                                            price: item.price,
                                                            qty: evt.target.value
                                                        }
                                                    ],
                                                }
                                                const deliverModalMod2 = {
                                                    ...deliverModalMod,
                                                    partialPrice: (deliverModalMod?.deliverQtys || []).reduce((acc, it) => {
                                                        return acc + (parseInt(it.qty) * parseFloat(it.price))
                                                    }, 0)
                                                }
                                                setDeliverModal(deliverModalMod2)
                                            }}
                                        />
                                    )
                                }
                            }
                        ]}
                        dataSource={deliverModal?.item?.items || []}
                        rowKey="id"
                    />
                </div>
                
                <br />
                <p style={{ marginBottom: 0 }}><strong>Importe total: </strong>{ deliverModal?.totalPrice || 0}€</p>
                <p><strong>Importe de los elementos seleccionados: </strong>{deliverModal?.partialPrice || 0}€</p>

                <SmallHeaderCollapse>
                    <Collapse>
                        <Collapse.Panel header="Restador" key="1">
                            <Form>
                                <p><strong>Importe: </strong>{ deliverModal.partialPrice || deliverModal.totalPrice }€</p>
                                <Form.Item
                                    label="Me pagan..."
                                >
                                    <Input 
                                        type="number" 
                                        suffix="€" 
                                        value={deliverModal?.inputMoney}
                                        onChange={evt => setDeliverModal({
                                            ...deliverModal,
                                            inputMoney: parseInt(evt.target.value || 0)
                                        })}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="Devuelvo..."
                                >p
                                    <Input type="number" suffix="€" disabled value={(deliverModal?.inputMoney || 0) - (deliverModal.partialPrice || deliverModal.totalPrice)}/>
                                </Form.Item>
                            </Form>
                        </Collapse.Panel>
                    </Collapse>
                </SmallHeaderCollapse>

                <div style={{ width: "100%", display: "flex", justifyContent: "space-evenly" }}>
                    <Button onClick={() => setDeliverModal({ visible: false })}>Cerrar</Button>
                    <Button 
                        type="primary"
                        onClick={() => deliverProducts({
                            reservation: deliverModal.item,
                            deliveredProducts: deliverModal.deliverQtys
                        })}
                    >Entregar</Button>
                    <Button 
                        type="primary"
                        onClick={() => deliverProducts({
                            reservation: deliverModal.item,
                            complete: true
                        })}
                    >Entregar todo</Button>
                </div>
            </Modal>
            
        </Container>
    )
}

const SmallHeaderCollapse = styled.div`
    margin: 1em 0;
    .ant-collapse-header{
        padding: 2px 1em !important;
    }
`

const Modifier = styled.div`
    tbody .nameCol{
        padding: 0;
    }
`

export default Reservations