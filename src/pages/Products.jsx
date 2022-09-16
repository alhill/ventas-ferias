import { Button, Modal, Input, Table, Tag, Form, Select, message, Checkbox } from 'antd'
import { collection, query, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from 'react'
import { Container } from '../components'
import { useFirebase } from '../context/firebase';
import { DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons'
import _ from 'lodash';
import estaSeguroDeQue from '../utils/estaSeguroDeQue';
import { basicSearch, basicSorter } from '../utils';

const Products = () => {
    const { firestore } = useFirebase()

    const [mutateModal, setMutateModal] = useState({ visible: false })
    const [mutateModalPack, setMutateModalPack] = useState({ visible: false })
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [packs, setPacks] = useState([])
    const [tags, setTags] = useState([])
    const [selectedTags, setSelectedTags] = useState([])
    const [selectedTagPack, setSelectedTagPack] = useState()
    const [loading, setLoading] = useState(false)
    const [loadingPack, setLoadingPack] = useState(false)
    const [search, setSearch] = useState("")

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

        (async () => {
            const config = (await getDoc(doc(collection(firestore, "config"), "1"))).data()
            const tags = config?.tags || []
            setTags(tags)
        })()
        
        return () => {
            unsubscribeProducts()
            unsubscribePacks()
        }
    }, [])

    const [form] = Form.useForm()
    const [formPack] = Form.useForm()

    const createProduct = async () => {
        try{
            setLoading(true)
            // const { name, tags, price1, price2 } = form.getFieldsValue(true)
            const { name, tags, price, active } = form.getFieldsValue(true)
            const added = await addDoc(collection(firestore, "products"), {
                name,
                tags,
                price: parseFloat(price),
                active
                // price: [price1, price2].filter(e => e)
            })
            setMutateModal({ visible: false })
            message.success("El producto se ha creado correctamente")
            setLoading(false)
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante la creación del producto")
        }
    }
    const updateProduct = async id => {
        try{
            setLoading(true)
            const { name, tags, price, active } = form.getFieldsValue(true)
            const updated = await setDoc(doc(firestore, "products", id), {
                name,
                tags,
                price: parseFloat(price),
                active
            })
            setMutateModal({ visible: false })
            message.success("El producto se ha editado correctamente")
            setLoading(false)
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante la edición del producto")
        }
    }
    const deleteProduct = async id => {
        try{
            const deleted = await deleteDoc(doc(firestore, "products", id))
            message.success("El producto se ha eliminado correctamente")
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante el borrado del producto")
        }
    }

    const createPack = async () => {
        try{
            setLoadingPack(true)
            // const { name, tags, price1, price2 } = form.getFieldsValue(true)
            const { name, tag, price, units } = formPack.getFieldsValue(true)
            const added = await addDoc(collection(firestore, "packs"), {
                name,
                tag,
                price: parseFloat(price),
                units
                // price: [price1, price2].filter(e => e)
            })
            setMutateModalPack({ visible: false })
            message.success("El pack se ha creado correctamente")
            setLoadingPack(false)
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante la creación del pack")
        }
    }
    const updatePack = async id => {
        try{
            setLoadingPack(true)
            const { name, tag, price, units } = formPack.getFieldsValue(true)
            const updated = await setDoc(doc(firestore, "packs", id), {
                name,
                tag,
                price: parseFloat(price),
                units
            })
            setMutateModalPack({ visible: false })
            message.success("El pack se ha editado correctamente")
            setLoadingPack(false)
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante la edición del pack")
        }
    }
    const deletePack = async id => {
        try{
            const deleted = await deleteDoc(doc(firestore, "packs", id))
            message.success("El pack se ha eliminado correctamente")
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante el borrado del pack")
        }
    }

    const columns = [
        {
            title: "Nombre",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => basicSorter(a, b, "name")
        },
        {
            title: "Precio",
            dataIndex: "price",
            key: "price",
            sorter: (a, b) => basicSorter(a, b, "price"),
            render: price => price + "€"
        },
        {
            title: "Activo",
            dataIndex: "active",
            key: "active",
            render: active => active ? "Sí" : "No",
            filters: [
                {
                    text: 'Activos',
                    value: true,
                },
                {
                    text: 'Inactivos',
                    value: false,
                }
            ],
            filterSearch: true,
            onFilter: (value, record) => {
                console.log({ value, record })
                return !!record.active === value
            }
        },
        {
            title: "Opciones",
            render: it => {
                return (
                    <div>
                        <Tag
                            onClick={() => {
                                form.setFieldsValue({
                                    name: it.name,
                                    price: it.price,
                                    tags: it.tags,
                                    active: !!it.active
                                })
                                setSelectedTags(it.tags)
                                setMutateModal({
                                    visible: true,
                                    edit: true,
                                    id: it.id
                                })
                            }}
                        ><EditOutlined /></Tag>
                        &nbsp;
                        <Tag 
                            color="volcano"
                            onClick={() => {
                                estaSeguroDeQue({
                                    desea: "eliminar",
                                    esto: it.name,
                                    loading,
                                    fn: async () => {
                                        setLoading(true)
                                        await deleteProduct(it.id)
                                        setLoading(false)
                                    }
                                })
                            }}
                        ><DeleteOutlined /></Tag>
                    </div>
                )
            }
        }
    ]

    const columnsPack = [
        {
            title: "Nombre",
            dataIndex: "name",
            key: "name"
        },
        {
            title: "Opciones",
            render: it => {
                return (
                    <div>
                        <Tag
                            onClick={() => {
                                formPack.setFieldsValue({
                                    name: it.name,
                                    price: it.price,
                                    tag: it.tag,
                                    units: it.units
                                })
                                setSelectedTagPack(it.tag)
                                setMutateModalPack({
                                    visible: true,
                                    edit: true,
                                    id: it.id
                                })
                            }}
                        ><EditOutlined /></Tag>
                        &nbsp;
                        <Tag 
                            color="volcano"
                            onClick={() => {
                                estaSeguroDeQue({
                                    desea: "eliminar",
                                    esto: it.name,
                                    loading,
                                    fn: async () => {
                                        setLoadingPack(true)
                                        await deletePack(it.id)
                                        setLoadingPack(false)
                                    }
                                })
                            }}
                        ><DeleteOutlined /></Tag>
                    </div>
                )
            }
        }
    ]

    useEffect(() => {
        const filteredProducts = basicSearch(search, products, ["name"])
        setFilteredProducts(filteredProducts)
    }, [products, search])

    return (
        <Container>
            <h2>Productos</h2>

            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1em" }}>
                <Input
                    placeholder="Buscar producto"
                    allowClear
                    value={search}
                    onChange={evt => setSearch(evt.target.value)}
                    style={{ maxWidth: 350 }}
                    prefix={<SearchOutlined />}
                />
                <Button 
                    onClick={() => setMutateModal({ visible: true, edit: false })}
                    onCancel={() => setMutateModal({ visible: false })}
                >Crear producto</Button>
            </div>

            <div style={{ width: "100%" }}>
                <Table
                    dataSource={filteredProducts}
                    rowKey="id"
                    columns={columns}
                />
            </div>

            <h2>Packs</h2>
            <Button 
                onClick={() => setMutateModalPack({ visible: true, edit: false })}
                onCancel={() => setMutateModalPack({ visible: false })}
                style={{ marginBottom: "1em" }}
            >Crear pack</Button>

            <div style={{ width: "100%" }}>
                <Table
                    dataSource={packs}
                    rowKey="id"
                    columns={columnsPack}
                />
            </div>

            <Modal 
                visible={mutateModal.visible}
                onCancel={() => setMutateModal({ visible: false })}
                onOk={() => mutateModal?.edit ? updateProduct(mutateModal?.id) : createProduct()}
                footer={null}
            >
                <h3>{mutateModal?.edit ? "Editar producto" : "Nuevo producto"}</h3>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={() => mutateModal?.edit ? updateProduct(mutateModal?.id) : createProduct()}
                    initialValues={{ active: true }}
                >
                    <Form.Item
                        name="name"
                        label="Nombre"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label="Precio"
                        rules={[{ required: true }]}
                    >
                        <Input type="number" suffix="€" />
                    </Form.Item>
                    <Form.Item
                        label="Etiquetas"
                    >
                        <Select
                            onChange={it => {
                                const tags = _.uniq([
                                    ...(form.getFieldValue("tags") || []),
                                    it
                                ])
                                form.setFieldsValue({ tags })
                                setSelectedTags(tags)
                            }}
                            style={{ marginBottom: 6 }}
                            showSearch
                        >
                            { tags.sort((a, b) => a > b ? 1 : -1).map((tag, i) => {
                                return (
                                    <Select.Option value={tag} key={"tag-option" + i}>{ tag }</Select.Option>
                                )
                            })}
                        </Select>
                        {(selectedTags || []).map((tag, i) => {
                            return (
                                <Tag key={"tag"+i} onClick={() => {
                                    const tags = form.getFieldValue("tags").filter(t => t !== tag)
                                    form.setFieldsValue({ tags })
                                    setSelectedTags(tags)
                                }}>{tag} &times;</Tag>
                            )
                        })}
                    </Form.Item>
                    <Form.Item
                        name="active"
                        label="Activo"
                        valuePropName='checked'
                    >
                        <Checkbox />
                    </Form.Item>
                </Form>
                <div>
                    <Button 
                        type="primary" 
                        loading={loading} 
                        onClick={() => form.submit()}
                    >{ mutateModal?.edit ? "Editar" : "Crear" }</Button>
                    &nbsp;&nbsp;
                    <Button
                        onClick={() => {
                            form.resetFields()
                            setSelectedTags([])
                        }}
                        >Vaciar</Button>
                    &nbsp;&nbsp;
                    <Button onClick={() => {
                        form.resetFields()
                        setLoading(false)
                        setMutateModal({ visible: false })
                        setSelectedTags([])
                    }}>Cancelar</Button>
                </div>
            </Modal>

            
            <Modal 
                visible={mutateModalPack.visible}
                onCancel={() => setMutateModalPack({ visible: false })}
                onOk={() => mutateModalPack?.edit ? updatePack(mutateModalPack?.id) : createPack()}
                footer={null}
            >
                <h3>{mutateModalPack?.edit ? "Editar pack" : "Nuevo pack"}</h3>
                <Form
                    form={formPack}
                    layout="vertical"
                    onFinish={() => mutateModalPack?.edit ? updatePack(mutateModalPack?.id) : createPack()}
                >
                    <Form.Item
                        name="name"
                        label="Nombre del pack"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label="Precio"
                        type="number"
                        rules={[{ required: true }]}
                    >
                        <Input type="number"/>
                    </Form.Item>
                    <Form.Item
                        name="units"
                        label="Unidades"
                        rules={[{ required: true }]}
                    >
                        <Input type="number"/>
                    </Form.Item>
                    <Form.Item
                        label="Etiqueta"
                        rules={[{ required: true }]}
                    >
                        <Select 
                            onChange={tag => {
                                setSelectedTagPack(tag)
                                formPack.setFieldsValue({ tag })
                            }}
                            value={selectedTagPack}
                        >

                            { tags.map((tag, i) => {
                                return (
                                    <Select.Option value={tag} key={"tag-option" + i}>{ tag }</Select.Option>
                                )
                            })}
                        </Select>
                    </Form.Item>
                </Form>
                <div>
                    <Button 
                        type="primary" 
                        loading={loadingPack} 
                        onClick={() => formPack.submit()}
                    >{ mutateModalPack?.edit ? "Editar" : "Crear" }</Button>
                    &nbsp;&nbsp;
                    <Button onClick={() => {
                        formPack.resetFields()
                        setLoadingPack(false)
                        setMutateModalPack({ visible: false })
                    }}>Cancelar</Button>
                </div>
            </Modal>
        </Container>
    )
}

export default Products