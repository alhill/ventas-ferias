import { getDoc, query, collection, getDocs, onSnapshot, doc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Container } from '../components'
import { useFirebase } from '../context/firebase'
import { useParams, Link } from 'react-router-dom'
import { Table } from 'antd'
import moment from 'moment'

const EventStatus = () => {

    const { firestore } = useFirebase()
    const { id } = useParams()

    const [products, setProducts] = useState([])
    const [packs, setPacks] = useState([])
    const [sales, setSales] = useState([])
    const [event, setEvent] = useState()
    const [tags, setTags] = useState([])
    const [total, setTotal] = useState()

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
            render: date => {
                return moment(date.seconds * 1000).format("DD-MM-YYYY HH:mm")
            }
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
            render: total => total + "€"
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
        </Container>
    )
}

export default EventStatus