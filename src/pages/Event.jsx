import { getDoc, query, collection, getDocs, onSnapshot, doc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Container } from '../components'
import { useFirebase } from '../context/firebase'
import { Button } from 'antd'
import { useParams, Link } from 'react-router-dom'
import styled from 'styled-components'

const Event = () => {

    const { firestore } = useFirebase()
    const { id } = useParams()

    const [products, setProducts] = useState([])
    const [event, setEvent] = useState()
    const [tags, setTags] = useState([])

    useEffect(() => {
        const unsubscribeProducts = onSnapshot(
            query(collection(firestore, "products")),
            qs => {
                const products = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setProducts(products)
            }
        );

        (async () => {
            const event = (await getDoc(doc(collection(firestore, "events"), id))).data()
            const config = (await getDoc(doc(collection(firestore, "config"), "1"))).data()
            const tags = config?.tags || []
            setEvent(event)
            setTags(tags)
        })()

        return () => unsubscribeProducts()
    }, [])


    return (
        <Container>
            <h2>Evento {event?.name}</h2>

            <BtnWrapper>
                <Link to={`/eventos/${id}/nueva-venta`}><Button>Nueva venta</Button></Link>
                <Link to={`/eventos/${id}/resumen`}><Button>Ver resumen</Button></Link>
            </BtnWrapper>
        </Container>
    )
}

const BtnWrapper = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-evenly;

`

export default Event