import { getDoc, query, collection, getDocs, onSnapshot, doc, where } from 'firebase/firestore'
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
    const [reservations, setReservations] = useState([])
    const [event, setEvent] = useState()
    const [tags, setTags] = useState([])
    const [total, setTotal] = useState()
    const [salesTotal, setSalesTotal] = useState()
    const [reservationsTotal, setReservationsTotal] = useState()
    const [reservationsPending, setReservationsPending] = useState()
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
                const sales = qs.docs
                    .map(doc => ({ ...doc.data(), id: doc.id }))
                    .sort((a, b) => a?.createdAt < b?.createdAt ? 1 : -1)


                setSales(sales)
            }
        );
        const unsubscribeReservations = onSnapshot(
            query(collection(firestore, `reservations`), where("assignedTo", "==", id)),
            qs => {
                const reservations = qs.docs
                    .map(doc => ({ ...doc.data(), id: doc.id }))
                setReservations(reservations)
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
            unsubscribeReservations()
        }
    }, [])

    const columns = type => {
        const onlyForReservations = type === "reservations" ? [
            {
                title: "Completada",
                key: "completed",
                render: it => {
                    if(it.completed){ return "Sí" }
                    else{
                        const totalItems = it.items.reduce((acc, it) => acc + it.qty, 0)
                        const totalDelivered = it.items.reduce((acc, it) => acc + it.delivered, 0)
                        return `${totalDelivered}/${totalItems} productos`
                    }
                }
            }
        ] : []

        return [
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
                    return allItems.reduce((acc, it) => acc + it.qty, 0)
                }
            },
            {
                title: "Importe",
                dataIndex: "total",
                key: "total",
                render: total => total + "€",
                sorter: (a, b) => basicSorter(a, b, "total")
            },
            ...onlyForReservations,
            {
                title: "Opciones",
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
                                item: populatedItem,
                                isReservation: type === "reservations"
                            })
                        }}
                    ><EyeOutlined /></Button>
                )
            }
        ]
    }

    const modalColumns = isReservation => {
        const onlyForReservations = isReservation ? [
            {
                title: "Entregadas",
                dataIndex: "delivered",
                key: "delivered"
            }
        ] : []
        return [
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
            ...onlyForReservations,
            {
                title: "Importe",
                dataIndex: "price",
                key: "price",
                sorter: (a, b) => basicSorter(a, b, "price"),
                render: price => price + "€"
            },
            {
                title: "Total",
                key: "total",
                sorter: (a, b) => basicSorter(a, b, "total"),
                render: it => {
                    if(!isReservation || (it.qty === it.delivered)){
                        return it.price*it.qty + "€"
                    } else {
                        return `${it.price*it.delivered}/${it.price*it.qty}€`
                    }
                }
            }
        ]
    }

    useEffect(() => {
        const total = sales.reduce((acc, it) => {
            return acc + it?.total
        }, 0)
        setSalesTotal(total)
        const reservationsMod = reservations.map(r => {
            return {
                completed: (r.items || []).reduce((acc, it) => acc + (it.delivered * it.price), 0),
                pending: (r.items || []).reduce((acc, it) => acc + ((it.qty - it.delivered) * it.price), 0)
            }
        })
        const reservationsTotal = reservationsMod.reduce((acc, it) => acc + it.completed, 0)
        const reservationsPending = reservationsMod.reduce((acc, it) => acc + it.pending, 0)

        setReservationsTotal(reservationsTotal)
        setReservationsPending(reservationsPending)

    }, [sales, reservations])

    return (
        <Container>
            <Link to={`/eventos/${id}`}>&lt; Volver</Link>
            <h2>Resumen {event?.name}</h2>

            <h4>Ventas: {salesTotal}€</h4>
            <h4>Reservas completadas: {reservationsTotal}€</h4>
            <h4>Reservas pendientes: {reservationsPending}€</h4>

            <h2>Total: {salesTotal + reservationsTotal }€</h2>

            <div style={{ width: "100%" }}>
                <h3>Ventas</h3>
                <Table
                    columns={columns("sales")}
                    dataSource={sales}
                    rowKey="id"
                />
            </div>

            <br />

            <div style={{ width: "100%" }}>
                <h3>Reservas</h3>
                <Table
                    columns={columns("reservations")}
                    dataSource={reservations}
                    rowKey="id"
                />
            </div>

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
                    columns={modalColumns(modalDetalle.isReservation)}
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