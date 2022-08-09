import { Button, Modal, Input, Table, Tag, Form, Select, message, DatePicker, Switch } from 'antd'
import { collection, query, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from 'react'
import { Container } from '../components'
import { useFirebase } from '../context/firebase';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import _ from 'lodash';
import estaSeguroDeQue from '../utils/estaSeguroDeQue';
import { useHistory, Link } from 'react-router-dom';
import moment from 'moment'

const Events = () => {
    const { firestore } = useFirebase()
    const history = useHistory()

    const [mutateModal, setMutateModal] = useState({ visible: false })
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const unsubscribeEvents = onSnapshot(
            query(collection(firestore, "events")),
            qs => {
                const events = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setEvents(events)
            }
        )
        return () => unsubscribeEvents()
    }, [])

    const [form] = Form.useForm()

    const createEvent = async () => {
        try{
            setLoading(true)
            const { name, date } = form.getFieldsValue(true)
            const added = await addDoc(collection(firestore, "events"), {
                name,
                date: date.toDate()
            })
            setMutateModal({ visible: false })
            message.success("El evento se ha creado correctamente")
            setLoading(false)
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante la creación del evento")
            setLoading(false)
        }
    }
    const updateEvent = async id => {
        try{
            setLoading(true)
            const { name, date } = form.getFieldsValue(true)
            const updated = await setDoc(doc(firestore, "events", id), {
                name,
                date: date.toDate()
            })
            setMutateModal({ visible: false })
            message.success("El evento se ha editado correctamente")
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante la edición del evento")
            setLoading(false)
        }
    }
    const deleteEvent = async id => {
        try{
            const deleted = await deleteDoc(doc(firestore, "events", id))
            message.success("El evento se ha eliminado correctamente")
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante el borrado del evento")
            setLoading(false)
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
                                console.log(it)
                                form.setFieldsValue({
                                    name: it.name,
                                    date: moment(it.date.toDate())
                                })
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
                                        await deleteEvent(it.id)
                                        setLoading(false)
                                    }
                                })
                            }}
                        ><DeleteOutlined /></Tag>
                    </div>
                )
            }
        },
        {  
            title: "",
            render: evt => {
                return (
                    <Link to={`/eventos/${evt.id}`}>
                        <Button 
                            type="primary"
                        >Entrar</Button>
                    </Link>
                )
            }
        }
    ]
    return (
        <Container>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <h2>Eventos</h2>
                <Button
                    onClick={() => setMutateModal({ visible: true, edit: false })}
                    onCancel={() => setMutateModal({ visible: false })}
                >Crear evento</Button>
            </div>

            <div
                style={{ width: "100%" }}
            >
                <Table
                    dataSource={events}
                    rowKey="id"
                    columns={columns}
                />
            </div>
            <Modal 
                visible={mutateModal.visible}
                onCancel={() => setMutateModal({ visible: false })}
                onOk={() => mutateModal?.edit ? updateEvent(mutateModal?.id) : createEvent()}
                footer={null}
            >
                <h3>{mutateModal?.edit ? "Editar evento" : "Nuevo evento"}</h3>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={() => mutateModal?.edit ? updateEvent(mutateModal?.id) : createEvent()}
                >
                    <Form.Item
                        name="name"
                        label="Nombre"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="date"
                        label="Fecha"
                        rules={[{ required: true }]}
                    >
                        <DatePicker />
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

export default Events