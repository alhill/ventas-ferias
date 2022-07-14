import { Button, Modal, Input, Table, Tag, Form, Select, message } from 'antd'
import { collection, query, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from 'react'
import { Container } from '../components'
import { useFirebase } from '../context/firebase';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import _ from 'lodash';
import estaSeguroDeQue from '../utils/estaSeguroDeQue';

const Products = () => {
    const { firestore } = useFirebase()

    const [mutateModal, setMutateModal] = useState({ visible: false })
    const [products, setProducts] = useState([])
    const [tags, setTags] = useState([])
    const [selectedTags, setSelectedTags] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        (async () => {
            const products = (await getDocs(query(collection(firestore, "products")))).docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }))
            const unsubscribeProducts = onSnapshot(
                query(collection(firestore, "products")),
                qs => {
                    const products = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                    setProducts(products)
                }
            )

            const config = (await getDoc(doc(collection(firestore, "config"), "1"))).data()
            const tags = config?.tags || []

            setProducts(products)
            setTags(tags)

            return () => unsubscribeProducts()
        })()
    }, [])

    const [form] = Form.useForm()

    const createProduct = async () => {
        try{
            setLoading(true)
            const { name, tags, price1, price2 } = form.getFieldsValue(true)
            const added = await addDoc(collection(firestore, "products"), {
                name,
                tags,
                price: [price1, price2].filter(e => e)
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
            const { name, tags, price1, price2 } = form.getFieldsValue(true)
            const updated = await setDoc(doc(firestore, "products", id), {
                name,
                tags,
                price: [price1, price2].filter(e => e)
            })
            setMutateModal({ visible: false })
            message.success("El producto se ha editado correctamente")
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
            message.error("Ocurrión un error durante el borrado del producto")
        }
    }

    const columns = [
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

                                const prices = (it.price || []).sort((a, b) => a<b ? 1 : -1)
                                form.setFieldsValue({
                                    name: it.name,
                                    price1: prices[0],
                                    price2: _.get(prices, "[1]"),
                                    tags: it.tags
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
    return (
        <Container>
            <h2>Productos</h2>
            <Button 
                onClick={() => setMutateModal({ visible: true, edit: false })}
                onCancel={() => setMutateModal({ visible: false })}
            >Crear producto</Button>

            <div>
                <Table
                    dataSource={products}
                    rowKey="id"
                    columns={columns}
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
                >
                    <Form.Item
                        name="name"
                        label="Nombre"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="price1"
                        label="Precio 1"
                        rules={[{ required: true }]}
                    >
                        <Input type="number"/>
                    </Form.Item>
                    <Form.Item
                        name="price2"
                        label="Precio 2"
                    >
                        <Input type="number"/>
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
                        >
                            { tags.map((tag, i) => {
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
                </Form>
                <div>
                    <Button 
                        type="primary" 
                        loading={loading} 
                        onClick={() => form.submit()}
                    >{ mutateModal?.edit ? "Editar" : "Crear" }</Button>
                    &nbsp;&nbsp;
                    <Button onClick={() => {
                        form.resetFields()
                        setLoading(false)
                        setMutateModal({ visible: false })
                    }}>Cancelar</Button>
                </div>
            </Modal>
        </Container>
    )
}

export default Products