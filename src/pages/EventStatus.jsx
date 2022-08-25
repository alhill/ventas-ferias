import { getDoc, query, collection, getDocs, onSnapshot, doc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Container } from '../components'
import { useFirebase } from '../context/firebase'
import { useParams, Link } from 'react-router-dom'
import { Button, Modal, Table } from 'antd'
import moment from 'moment'
import { EyeOutlined } from '@ant-design/icons'
import { basicSorter } from '../utils'

const EventStatus = () => {

    const { firestore } = useFirebase()
    const { id } = useParams()

    const [products, setProducts] = useState([])
    const [packs, setPacks] = useState([])
    const [sales, setSales] = useState([])
    const [event, setEvent] = useState()
    const [tags, setTags] = useState([])
    const [total, setTotal] = useState()
    const [modalDetalle, setModalDetalle] = useState({
        visible: false
    })

    useEffect(() => {
        const unsubscribeProducts = onSnapshot(
            query(collection(firestore, "products")),
            qs => {
                const products = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setProducts(products)
            }
        );
        const unsubscribePacks = onSnapshot(
            query(collection(firestore, "packs")),
            qs => {
                const packs = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setPacks(packs)
            }
        );
        const unsubscribeSales = onSnapshot(
            query(collection(firestore, `events/${id}/sales`)),
            qs => {
                const sales = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setSales(sales)
            }
        );

        (async () => {
            const eventRaw = (await getDoc(doc(collection(firestore, "events"), id)))
            const event = {
                id: eventRaw.id,
                ref: eventRaw.ref,
                ...eventRaw.data()
            }
            const config = (await getDoc(doc(collection(firestore, "config"), "1"))).data()
            const tags = config?.tags || []
            setEvent(event)
            setTags(tags)
        })()

        return () => {
            unsubscribeProducts()
            unsubscribePacks()
            unsubscribeSales()
        }
    }, [])

    const columns = [
        {
            title: "Fecha",
            dataIndex: "createdAt",
            key: "date",
            render: date => moment(date.seconds * 1000).format("DD-MM-YYYY HH:mm"),
            sorter: (a, b) => basicSorter(a?.createdAt, b?.createdAt, "seconds")
        },
        {
            title: "Nº artículos",
            dataIndex: "items",
            key: "items",
            render: items => {
                const allItems = items.map(it => it?.subItems ? it.subItems : it).flat()
                return allItems.length
            }
        },
        {
            title: "Importe",
            dataIndex: "total",
            key: "total",
            render: total => total + "€",
            sorter: (a, b) => basicSorter(a, b, "total")
        },
        {
            key: "detalleBtn",
            render: item => (
                <Button
                    onClick={() => {
                        const populatedItem = {
                            ...item,
                            items: (item?.items || []).map(it => {
                                return {
                                    ...it,
                                    name: products.find(p => p.id === it.id)?.name
                                }
                            })
                        }
                        setModalDetalle({
                            visible: true,
                            item: populatedItem
                        })
                    }}
                ><EyeOutlined /></Button>
            )
        }
    ]

    useEffect(() => {
        const total = sales.reduce((acc, it) => {
            return acc + it?.total
        }, 0)
        setTotal(total + "€")
    }, [sales])

    return (
        <Container>
            <Link to={`/eventos/${id}`}>&lt; Volver</Link>
            <h2>Resumen {event?.name}</h2>

            <h4>Total: {total}</h4>
            <Table
                columns={columns}
                dataSource={sales}
                rowKey="id"
            />

            {/* Modal detalle */}
            <Modal
                visible={modalDetalle?.visible}
                footer={null}
                onCancel={() => setModalDetalle({ visible: false })}
            >
                <p><strong>Evento: </strong>{ event?.name }</p>
                <p><strong>Hora: </strong>{ moment(modalDetalle?.item?.createdAt?.seconds, "X").format("DD-MM-YYYY HH:mm")}</p>
                <p><strong>Forma de pago: </strong>{ modalDetalle?.item?.paymentMethod}</p>
                { modalDetalle?.item?.description && <p><strong>Notas: </strong>{ modalDetalle?.item?.description }</p> }

                <h3>Productos</h3>
                <Table
                    rowKey="id"
                    dataSource={(modalDetalle?.item?.items || [])}
                    columns={[
                        {
                            title: "Nombre",
                            dataIndex: "name",
                            key: "name",
                            sorter: (a, b) => basicSorter(a, b, "name"),
                        },
                        {
                            title: "Cantidad",
                            dataIndex: "qty",
                            key: "qty",
                            sorter: (a, b) => basicSorter(a, b, "qty"),
                        },
                        {
                            title: "Importe",
                            dataIndex: "price",
                            key: "price",
                            render: price => price + "€",
                            sorter: (a, b) => basicSorter(a, b, "price")
                        }
                    ]}
                />

                <div style={{ display: "flex", justifyContent: "center" }}>
                    <Button
                        type="primary"
                        onClick={() => setModalDetalle({ visible: false })}

                    >Cerrar</Button>
                </div>

            </Modal>
        </Container>
    )
}

export default EventStatus