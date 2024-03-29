import { getDoc, query, collection, addDoc, onSnapshot, doc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Container, ProductBtn, PackBtn } from '../components'
import { useFirebase } from '../context/firebase'
import { useParams, useHistory, Link } from 'react-router-dom'
import { Radio, Button, Modal, Form, Select, Input, message, Collapse } from 'antd'
import styled from 'styled-components'
import _ from 'lodash'
import { cleanStr } from '../utils'
import { SearchOutlined } from '@ant-design/icons'

const Event = () => {

    const { firestore } = useFirebase()
    const { id } = useParams()
    const [formEnd] = Form.useForm()
    const history = useHistory()

    const [products, setProducts] = useState([])
    const [packs, setPacks] = useState([])
    const [events, setEvents] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [event, setEvent] = useState()
    const [tags, setTags] = useState([])
    const [selectedTag, setSelectedTag] = useState()
    const [assignedToEvent, setAssignedToEvent] = useState()
    const [saleStatus, setSaleStatus] = useState({})
    const [packItems, setPackItems] = useState([])
    const [search, setSearch] = useState("")
    const [modalPackSelector, setModalPackSelector] = useState({ visible: false })
    const [modalEndSale, setModalEndSale] = useState({ visible: false })
    const [modalTotal, setModalTotal] = useState()
    const [paymentMethod, setPaymentMethod] = useState("Efectivo")
    const [reservationMethod, setReservationMethod] = useState()
    const [inputMoney, setInputMoney] = useState()
    const [loadingSale, setLoadingSale] = useState(false)
    const [isReservation, setReservation] = useState(false)

    const filterByTag = (products, tag) => {
        const filteredProducts = products
            .filter(p => !tag || p.tags.includes(selectedTag))
            .sort((a, b) => a.tags[0] > b.tags[1] ? 1 : -1)
            .sort((a, b) => a.name > b.name ? 1 : -1)
        setFilteredProducts(filteredProducts)
    }

    const mutateStatus = (product, delta, pack) => {
        const oldQty = saleStatus[product]
        let saleStatusMod = {...saleStatus}
        const newQty = (oldQty || 0) + delta
        if(newQty < 1){
            saleStatusMod = _.omit(saleStatusMod, [product])
        } else {
            if(pack){
                saleStatusMod = _.omit(saleStatusMod, [product])
            }
            else {
                saleStatusMod[product] = newQty
            }
        }
        setSaleStatus(saleStatusMod)
    }

    useEffect(() => {
        const isReservation = history.location.pathname === "/nueva-reserva"
        setReservation(isReservation)

        const unsubscribeProducts = onSnapshot(
            query(collection(firestore, "products")),
            qs => {
                const products = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setProducts(products.filter(p => p.active))
            }
        );
        const unsubscribePacks = onSnapshot(
            query(collection(firestore, "packs")),
            qs => {
                const packs = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setPacks(packs)
            }
        );
        let unsubscribeEvents = () => {}

        (async () => {
            if(!isReservation){
                const event = (await getDoc(doc(collection(firestore, "events"), id))).data()
                setEvent(event)
            } else {
                unsubscribeEvents = onSnapshot(
                    query(collection(firestore, "events")),
                    qs => {
                        const events = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                        setEvents(events)
                    }
                );
            }
            const config = (await getDoc(doc(collection(firestore, "config"), "1"))).data()
            const tags = (config?.tags || []).sort((a, b) => a > b ? 1 : -1)
            setTags(tags)
        })()

        return () => {
            unsubscribeProducts()
            unsubscribePacks()
            unsubscribeEvents()
        }
    }, [])

    useEffect(() => {
        filterByTag(products, selectedTag)
    }, [products, selectedTag])

    useEffect(() => {
        if(modalEndSale.visible){
            setModalTotal(calculateTotal())
        }
    }, [modalEndSale])

    useEffect(() => {
        if(search){
            setSelectedTag(undefined)
            const filteredProducts = products.filter(fp => {
                return cleanStr(fp.name).includes(cleanStr(search))
            })
            setFilteredProducts(filteredProducts)
        } else {
            setFilteredProducts(products)
        }

    }, [search])

    const calculateTotal = () => {
        const reducito = Object.entries(saleStatus).reduce((acc, it) => {
            const product = [...products, ...packs].find(p => p.id === it[0])
            return acc + (product.price * (it[1]?.qty || it[1]))
        }, 0)
        return reducito
    }

    return (
        <Container>
            <Link to={`/eventos/${id}`}>&lt; Volver</Link>
            <h2>Nueva {isReservation ? "reserva" : `venta ${event?.name}`}</h2>

            <Button
                onClick={() => setModalEndSale({
                    visible: true
                })}
            >Acabar {isReservation ? "reserva" : "venta"}</Button>

            <br />

            <h4>Productos</h4>
            <Radio.Group
                onChange={evt => setSelectedTag(evt.target.value)}
                value={selectedTag}
                style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}
            >
                { [...tags, "Packs"].map((t, i) => {
                    return (
                        <Radio.Button 
                            key={"tag-"+i}
                            value={t}
                            onClick={() => t === selectedTag && setSelectedTag(undefined)}
                        >{t}</Radio.Button>
                    )
                })}
            </Radio.Group>

            <br />

            <Input 
                prefix={<SearchOutlined />}
                value={search}
                onChange={evt => setSearch(evt.target.value)}
                allowClear
            />

            <br />

            { selectedTag !== "Packs" && (
                <div>
                    <ProductWrapper>
                        { filteredProducts.map(fp => {
                            return (
                                <ProductBtn
                                    key={`fp-${fp.id}`}
                                    product={fp}
                                    mutateStatus={mutateStatus}
                                    qty={saleStatus[fp.id] || 0}
                                />
                            )
                        })}
                    </ProductWrapper>
                     <br />
                </div>
            )}

            <h4>Packs</h4>
            <ProductWrapper>
                { packs.map(p => {
                    return (
                        <ProductBtn
                            key={`pack-${p.id}`}
                            product={p}
                            mutateStatus={mutateStatus}
                            qty={saleStatus[p.id] || 0}
                            modalPack={modalPackSelector}
                            setModalPack={setModalPackSelector}
                        />
                    )
                })}
            </ProductWrapper>

            <Modal
                visible={modalPackSelector?.visible}
                onCancel={() => setModalPackSelector({ visible: false })}
                footer={null}
            >
                <ProductWrapper>
                    {(products.filter(p => p.active && p.tags.includes(modalPackSelector?.pack?.tag)) || []).map(p => {
                        return (
                            <PackBtn
                                key={`pack-${p.id}`}
                                pack={modalPackSelector?.pack}
                                product={p}
                                packItems={packItems}
                                setPackItems={setPackItems}
                                qty={packItems.length || 0}
                            />
                        )
                    })}
                </ProductWrapper>
                <br />
                <ProductWrapper>
                    <Button onClick={() => {
                        setModalPackSelector({ visible: false })
                        setPackItems([])
                    }}>Cancelar</Button>
                    <Button
                        disabled={packItems.length < modalPackSelector?.pack?.units}
                        type="primary"
                        onClick={() => {
                            const newStatus = {
                                ...saleStatus,
                                [modalPackSelector?.pack?.id]: {
                                    qty: (saleStatus[modalPackSelector?.pack?.id]?.qty || 0) + 1,
                                    items: [
                                        ...(modalPackSelector?.pack?.items || []),
                                        ...packItems
                                    ]
                                }
                            }
                            setSaleStatus(newStatus)
                            setModalPackSelector({ visible: false })
                            setPackItems([])
                        }}
                    >Aceptar</Button>
                </ProductWrapper>
            </Modal>

            <Modal
                visible={modalEndSale?.visible}
                onCancel={() => setModalEndSale({ visible: false })}
                footer={null}
            >
                <h2>Total: { modalTotal }€</h2>

                <Form
                    form={formEnd}
                    layout="vertical"
                    onFinish={async dataForm => {
                        setLoadingSale(true)
                        try{
                            const items = Object.entries(saleStatus).map(ss => {
                                const item = [...products, ...packs].find(p => p.id === ss[0])
                                const isPack = !!(ss[1]?.items)
                                const subItems = isPack && { subItems: (ss[1].items.map(it => ({
                                    id: it,
                                    ref: doc(firestore, "products", it)
                                })))}
                                
                                return {
                                    id: ss[0],
                                    ref: doc(firestore, isPack ? "packs" : "products", ss[0]),
                                    qty: ss[1]?.qty || ss[1],
                                    price: item.price,
                                    ...subItems
                                }
                            })
                            let sale = {
                                createdAt: new Date(),
                                ...(paymentMethod ? { paymentMethod: paymentMethod } : {}),
                                ...(reservationMethod ? { reservationMethod: reservationMethod } : {}),
                                total: calculateTotal(),
                                ..._.omit(dataForm, ["observations", "address"]),
                                completed: !isReservation,
                                ...(dataForm?.observations ? { observations: dataForm.observations } : {}),
                                ...(dataForm?.address ? { address: dataForm.address } : {}),
                                items: items.map(it => {
                                    if(isReservation){ return { ...it, delivered: 0 }}
                                    else { return it }
                                })
                            }
                            if(sale.name === undefined){ sale.name = null }

                            if(isReservation){
                                await addDoc(collection(firestore, "reservations"), sale)
                            } else {
                                const docRef = doc(firestore, "events", id);
                                const colRef = collection(docRef, "sales")
                                await addDoc(colRef, sale);
                            }
                            message.success(`La ${isReservation ? "reserva" : "venta"} se ha guardado correctamente`)
                            history.push(isReservation ? "/reservas" : `/eventos/${id}`)
                        } catch(err) {
                            console.log(err)
                            message.error(`Ocurrió un error durante el guardado de la ${isReservation ? "reserva" : "venta"}`)
                        }
                        setLoadingSale(false)
                    }}
                >
                    { isReservation && (
                        <Form.Item
                            label="Método de contacto"
                            rules={[{ required: true }]}
                        >
                            <Select
                                onChange={evt => {
                                    setReservationMethod(evt)
                                }}
                            >
                                <Select.Option value="Email">Email</Select.Option>
                                <Select.Option value="Instagram">Instagram</Select.Option>
                                <Select.Option value="Teléfono/Whatsapp">Teléfono/Whatsapp</Select.Option>
                                <Select.Option value="Otros">Otros</Select.Option>
                            </Select>
                        </Form.Item>
                    )}
                    { isReservation && (
                        <Form.Item
                            name="address"
                            label="Dirección/Número"
                        >
                            <Input />
                        </Form.Item>
                    )}
                    { !isReservation && (
                        <Form.Item
                            name="paymentMethod"
                            label="Forma de pago"
                            rules={[{ required: true }]}
                            initialValue="Efectivo"
                        >
                            <Select onChange={evt => { setPaymentMethod(evt) }}>
                                <Select.Option value="Efectivo">Efectivo</Select.Option>
                                <Select.Option value="Bizum">Bizum</Select.Option>
                            </Select>
                        </Form.Item>
                    )}
                    { isReservation && (
                        <Form.Item
                            name="assignedTo"
                            label="Asignar a evento"
                        >
                            <Select
                                onChange={evt => { setAssignedToEvent(evt) }}
                                showSearch={true}
                                allowClear
                                filterOption={(input, option) => cleanStr(option?.children || "").includes(cleanStr(input || ""))}
                            >
                                {(events || []).map(event => {
                                    return (
                                        <Select.Option key={event.id} value={event.id}>{ event.name }</Select.Option>
                                    )
                                })}
                            </Select>
                        </Form.Item>
                    )}

                    { paymentMethod === "Efectivo" && (
                        <div>
                            <Form.Item
                                label="Me pagan..."
                            >
                                <Input
                                    type="number"
                                    onChange={evt => setInputMoney(evt.target.value)}
                                    suffix="€"
                                ></Input>
                            </Form.Item>

                            <Form.Item
                                label="Devuelvo"
                            >
                                <Input
                                    disabled
                                    type="number"
                                    suffix="€"
                                    value={inputMoney && (inputMoney - modalTotal)}
                                />
                            </Form.Item>
                        </div>
                    )}

                    <Collapse>
                        <Collapse.Panel header="Datos opcionales">
                            <Form.Item
                                name="name"
                                label="Nombre del cliente"
                                rules={isReservation ? [{ required: true }] : []}
                                >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="observations"
                                label="Observaciones"
                                >
                                <Input.TextArea />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>
                </Form>

                <br />

                <BtnWrapper>
                    <Button onClick={() => {
                        setModalEndSale({ visible: false })
                        setModalTotal()
                    }}>Cancelar</Button>
                    <Button
                        loading={loadingSale}
                        type="primary"
                        onClick={async () => {
                            formEnd.submit()
                        }}
                    >Aceptar</Button>
                </BtnWrapper>
            </Modal>
        </Container>
    )
}

const ProductWrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
`

const BtnWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-evenly;
`

export default Event