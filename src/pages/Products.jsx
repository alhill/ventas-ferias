import { Button, Modal, Input, Table, Tag, Form, Select, message, Checkbox, Upload, Popover } from 'antd'
import { collection, query, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react'
import { Container, PicSquare } from '../components'
import { useFirebase } from '../context/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { DeleteOutlined, EditOutlined, InfoCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import _ from 'lodash';
import estaSeguroDeQue from '../utils/estaSeguroDeQue';
import { basicSearch, basicSorter, cleanStr } from '../utils';
import styled from 'styled-components'

const Products = () => {
    const { firestore, storage } = useFirebase()

    const [mutateModal, setMutateModal] = useState({ visible: false })
    const [mutateModalPack, setMutateModalPack] = useState({ visible: false })
    const [mutateModalVariants, setMutateModalVariants] = useState({ visible: false })
    const [modalPics, setModalPics] = useState([])
    const [products, setProducts] = useState([])
    const [variants, setVariants] = useState([])
    const [slugs, setSlugs] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [packs, setPacks] = useState([])
    const [tags, setTags] = useState([])
    const [selectedTags, setSelectedTags] = useState([])
    const [selectedTagPack, setSelectedTagPack] = useState()
    const [loading, setLoading] = useState(false)
    const [loadingPack, setLoadingPack] = useState(false)
    const [loadingVariants, setLoadingVariants] = useState(false)
    const [search, setSearch] = useState("")
    const [selectedVariantItems, setSelectedVariantItems] = useState([])
    const [productPicsToCheck, setProductPicsToCheck] = useState([])

    useEffect(() => {
        const unsubscribeProducts = onSnapshot(
            query(collection(firestore, "products")),
            qs => {
                const products = qs.docs.map(doc => {
                    const data = doc.data()
                    return {
                        ...data, 
                        id: doc.id,
                        discountedProduct: !!data.discountedPrice
                    }
                })
                console.log(products[0])
                setProducts(products)
                setSlugs(products.map(p => p.slug).filter(e => e))
            }
        );
        const unsubscribePacks = onSnapshot(
            query(collection(firestore, "packs")),
            qs => {
                const packs = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setPacks(packs)
            }
        );
        const unsubscribeVariants = onSnapshot(
            query(collection(firestore, "variants")),
            qs => {
                const variants = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setVariants(variants)
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
            unsubscribeVariants()
        }
    }, [])

    const [form] = Form.useForm()
    const [formPack] = Form.useForm()
    const [formVariant] = Form.useForm()

    const checkAndDeletePics = async (pics, picsToCheck) => {

    }

    const createProduct = async () => {
        try{
            setLoading(true)

            await checkAndDeletePics(modalPics, productPicsToCheck)
            const { name, name_en, description, description_en, tags, price, discountedPrice, discountedProduct, active, frontpage, featured, slug } = form.getFieldsValue(true)
            const added = await addDoc(collection(firestore, "products"), {
                name,
                name_en,
                description,
                description_en,
                tags,
                price: parseFloat(price),
                discountedPrice: (discountedPrice && discountedProduct) ? parseFloat(discountedPrice) : null,
                active,
                pictures: modalPics,
                frontpage,
                featured,
                slug
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
            const { name, name_en, description, description_en, tags, price, discountedPrice, discountedProduct, active, frontpage, featured, slug } = form.getFieldsValue(true)
            const updated = await setDoc(doc(firestore, "products", id), {
                name,
                name_en,
                description,
                description_en,
                tags,
                price: parseFloat(price),
                discountedPrice: (discountedPrice && discountedProduct) ? parseFloat(discountedPrice) : null,
                active,
                pictures: modalPics,
                frontpage: !!frontpage,
                featured: !!featured,
                slug
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
    const deleteVariant = async ({ id, items }) => {
        try{
            const deleted = await deleteDoc(doc(firestore, "variants", id))
            const proms = items.map(async d => {
                const resp = await updateDoc(doc(firestore, "products", d), { variantGroup: null })
                return resp
            })
            await Promise.all(proms)
            message.success("El grupo de variantes se ha eliminado correctamente")
        } catch(err) {
            console.log(err)
            message.error("Ocurrió un error durante el borrado del grupo de variantes")
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
            // dataIndex: "price",
            key: "price",
            sorter: (a, b) => basicSorter(a, b, "price"),
            render: it => {
                return (
                    <div>
                        <span style={{ textDecoration: it.discountedPrice ? "line-through" : "none" }}>{it.price + "€"}</span>
                        { it.discountedPrice && <strong>&nbsp;&nbsp;{it.discountedPrice + "€"}</strong> }
                    </div>
                )
            }
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
                                    name_en: it.name_en,
                                    description: it.description,
                                    description_en: it.description_en,
                                    price: it.price,
                                    discountedPrice: it.discountedPrice,
                                    discountedProduct: it.discountedProduct,
                                    tags: it.tags,
                                    active: !!it.active,
                                    featured: it.featured,
                                    frontpage: it.frontpage,
                                    slug: it.slug
                                })
                                setSelectedTags(it.tags)
                                setMutateModal({
                                    visible: true,
                                    edit: true,
                                    id: it.id
                                })
                                setModalPics(it.pictures || [])
                                setProductPicsToCheck(it.pictures || [])
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

    const columnsVariants = [
        {
            title: "Nombre",
            dataIndex: "name",
            key: "name"
        },
        {
            title: "Items",
            render: aaa => Array.isArray(aaa?.items) ? aaa.items.length : "-"
        },
        {
            title: "Opciones",
            render: it => {
                return (
                    <div>
                        <Tag
                            onClick={() => {
                                console.log(it)
                                formVariant.setFieldsValue({
                                    name: it.name,
                                })
                                setSelectedVariantItems((it?.items || []).map(vId => products.find(p => p.id === vId)))
                                setMutateModalVariants({
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
                                        setLoadingVariants(true)
                                        await deleteVariant(it)
                                        setLoadingVariants(false)
                                    }
                                })
                            }}
                        ><DeleteOutlined /></Tag>
                    </div>
                )
            }
        }
    ]

    const holiFn = async () => {
        const checkouts = (await getDocs(collection(firestore, "/users/RoauX7Kts5ZY0aXAB7uATJnOZ8y2/checkouts"))).docs.map(doc => ({
            ...doc.data(),
            path: doc.ref.path.replace("checkouts", "orders")
        }))
        console.log(checkouts)
        for(const moved of checkouts){
            const singleMoved = await setDoc(doc(firestore, moved.path), _.omit(moved, ["path"]))
            console.log(394, singleMoved)
        }
    }

    useEffect(() => {
        // const allTags = _.uniq(products.map(p => p.tags || []).flat(4));
        // (async () => {
        //     const qwe = await setDoc(doc(firestore, "config/1"), { tags: allTags })
        //     console.log(qwe)
        // })()
        const filteredProducts = basicSearch(search, products, ["name"])
        setFilteredProducts(filteredProducts)
    }, [products, search])

    const autogenerateSlug = () => {
        console.log("slug!!")
        const name = form.getFieldValue("name")
        let flag = false
        let letsTry = _.kebabCase(name)
        while(!flag){
            if(slugs.includes(letsTry)){
                const splitted = letsTry.split("-")
                const lastChunk = parseInt(splitted.slice(-1)[0])
                if(!Number.isNaN(parseInt(lastChunk))){
                    letsTry = [...splitted.slice(0, -1), lastChunk+1].reduce((acc, it) => acc + "-" + it)
                } else {
                    letsTry = letsTry + "-2"
                }
            } else {
                flag = true
            }
        }
        form.setFieldsValue({ slug: letsTry })
    }

    return (
        <Container>
            <h2>Productos</h2>

            {/* <Button onClick={() => holiFn()}>Holi</Button> */}
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
                    onClick={() => {
                        setMutateModal({ visible: true, edit: false })
                        setModalPics([])
                    }}
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

            <br />

            <h2>Grupos de variantes</h2>
            <Button 
                onClick={() => setMutateModalVariants({ visible: true, edit: false })}
                onCancel={() => setMutateModalVariants({ visible: false })}
                style={{ marginBottom: "1em" }}
            >Crear grupo de variantes</Button>

            <div style={{ width: "100%" }}>
                <Table
                    dataSource={variants}
                    rowKey="id"
                    columns={columnsVariants}
                />
            </div>

            <br />

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
                        name="name_en"
                        label="Nombre (EN)"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Descripcion"
                    >
                        <Input.TextArea autoSize />
                    </Form.Item>
                    <Form.Item
                        name="description_en"
                        label="Descripcion (EN)"
                    >
                        <Input.TextArea autoSize />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[{ required: true, message: "Campo requerido" }]}
                    >
                        <Input 
                            suffix={
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={autogenerateSlug}
                                >
                                    Auto
                                </Button>
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        name="price"
                        label="Precio"
                        rules={[{ required: true }]}
                    >
                        <Input type="number" suffix="€" />
                    </Form.Item>
                    <Form.Item
                        name="discountedProduct"
                        label="Producto rebajado"
                        valuePropName='checked'
                    >
                        <Checkbox />
                    </Form.Item>
                    <Form.Item
                        name="discountedPrice"
                        label="Precio rebajado"
                        rules={[{ validator: async (rule, value) => {
                            const isDiscounted = form.getFieldValue("discountedProduct")
                            const parsedValue = parseFloat(value)
                            if(isDiscounted && Number.isNaN(parsedValue)){
                                throw new Error("El valor es incorrecto")
                            }
                            if(isDiscounted && !value){
                                throw new Error("No se ha introducido un precio rebajado")
                            }
                            if(isDiscounted && parsedValue >= form.getFieldValue("price")){
                                throw new Error("El precio rebajado es mayor o igual que el normal")
                            }
                        }}]}
                    >
                        <Input type="number" suffix="€" />
                    </Form.Item>
                    <Form.Item
                        label="Imágenes"
                    >
                        <PicWrapper>
                            {modalPics.map((pic, i) => {
                                return <PicSquare
                                    picList={modalPics}
                                    setPicList={setModalPics}
                                    pic={pic}
                                    idx={i}
                                    key={`pic-${i}`}
                                    destacada={true}
                                />
                            })}  
                            <Upload
                                name="file"
                                customRequest={async evt => {
                                    const fullName = evt?.file?.name
                                    const ext = fullName.split(".").slice(-1)[0]
                                    const fileName = `${fullName.split(".").slice(0, -1).join(".")}-${new Date().getTime()}.${ext}`

                                    if(["jpg", "jpeg", "png", "webp"].includes(ext)){
                                        const route = "productImg/" + fileName
                                        const newImgRef = ref(storage, route)
                                        try{
                                            const uploaded = await uploadBytes(newImgRef, evt.file)
                                            const url = await getDownloadURL(uploaded.ref)
                                            const mutatedPicList = [
                                                ...modalPics,
                                                {
                                                    url,
                                                    route,
                                                    main: modalPics.length === 0 
                                                }
                                            ]
                                            setModalPics(mutatedPicList)
                                            setProductPicsToCheck(mutatedPicList)
                                        } catch(err) {
                                            console.log(err)
                                            message.error("Ocurrió un error durante la subida del archivo")
                                        }
                                    } else {
                                        message.error("Tipos de archivo admitidos: JPG, PNG y WEBP")
                                    }
                                }}
                                showUploadList={false}
                            >
                                <Button 
                                    icon={<PlusOutlined />}
                                    style={{
                                        width: 100,
                                        height: "calc(100px + 2em)",
                                        marginBottom: "1em"
                                    }}
                                ></Button>
                            </Upload>
                        </PicWrapper>
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
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <Form.Item
                            name="active"
                            label="Activo"
                            valuePropName='checked'
                        >
                            <Checkbox />
                        </Form.Item>
                        <Form.Item
                            name="featured"
                            label="Destacado"
                            valuePropName='checked'
                        >
                            <Checkbox />
                        </Form.Item>
                        <Form.Item
                            name="frontpage"
                            label="Página principal"
                            valuePropName='checked'
                        >
                            <Checkbox />
                        </Form.Item>
                    </div>
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

            <Modal 
                visible={mutateModalVariants.visible}
                onCancel={() => setMutateModalVariants({ visible: false })}
                onOk={() => mutateModalPack?.edit ? updatePack(mutateModalVariants?.id) : createPack()}
                footer={null}
            >
                <h3>{mutateModalVariants?.edit ? "Editar grupo de variantes" : "Nuevo grupo de variantes"}</h3>
                <Form
                    form={formVariant}
                    layout="vertical"
                    onFinish={async ({ name }) => {
                        if(mutateModalVariants.edit) {
                            try{
                                const thisVariant = variants.find(v => v.id === mutateModalVariants.id)
                                const deletedFromGroup = _.difference(thisVariant.items, selectedVariantItems.map(svi => svi.id))
                                const updated = await setDoc(doc(firestore, "variants", mutateModalVariants?.id), {
                                    name,
                                    items: selectedVariantItems.map(svi => svi.id)
                                })
                                const proms1 = selectedVariantItems.map(async svi => {
                                    const resp = await updateDoc(doc(firestore, "products", svi.id), { variantGroup: mutateModalVariants.id })
                                    return resp
                                })
                                const proms2 = deletedFromGroup.map(async d => {
                                    const resp = await updateDoc(doc(firestore, "products", d), { variantGroup: null })
                                    return resp
                                })
                                await Promise.all([...proms1, ...proms2])
                                setMutateModalVariants({ visible: false })
                                setSelectedVariantItems([])
                            } catch(err) {
                                console.log(err)
                                message.error("Ocurrió un error al guardar el grupo de variantes")
                            }
                        } else {
                            try{
                                const added = await addDoc(collection(firestore, "variants"), {
                                    name,
                                    items: selectedVariantItems.map(svi => svi.id)
                                })
                                const proms = selectedVariantItems.map(async svi => {
                                    const resp = await updateDoc(doc(firestore, "products", svi.id), { variantGroup: added.id })
                                    return resp
                                })
                                await Promise.all(proms)
                                setMutateModalVariants({ visible: false })
                                setSelectedVariantItems([])
                            } catch(err) {
                                console.log(err)
                                message.error("Ocurrió un error al guardar el grupo de variantes")
                            }
                        }
                    }}
                >
                    <Form.Item
                        name="name"
                        label="Nombre del grupo de variantes"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Elementos del grupo de variantes"
                    >
                        <Select 
                            showSearch
                            placeholder="Selecciona productos"
                            onChange={evt => {
                                if(!selectedVariantItems.map(svi => svi.id).includes(evt)){
                                    setSelectedVariantItems([
                                        ...selectedVariantItems,
                                        { id: evt, name: products.find(p => p.id === evt)?.name }
                                    ])
                                } else {
                                    message.warning("Ese elemento ya está añadido al grupo de variantes")
                                }
                            }}
                            filterOption={(input, option) => cleanStr(option.label).includes(cleanStr(input))}
                            options={(products || []).filter(p => !p.variantGroup).map(p => ({ label: p.name, value: p.id }))}
                        />
                    </Form.Item>
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                        { selectedVariantItems.map(svi => (
                            <Tag 
                                key={`tag-${svi.id}`} 
                                style={{ pointer: "initial", alignItems: "center", display: "inline-flex", marginBottom: 5 }}
                            >
                                { svi.name }&nbsp;
                                <div 
                                    style={{ fontSize: 20, marginTop: -5, cursor: "pointer" }}
                                    onClick={() => setSelectedVariantItems(selectedVariantItems.filter(it => it.id !== svi.id))}
                                >&times;</div>
                            </Tag>
                        ))}
                    </div>
                    <br />
                </Form>
                <div>
                    <Button 
                        type="primary" 
                        loading={loadingVariants} 
                        onClick={() => formVariant.submit()}
                    >{ mutateModalVariants?.edit ? "Editar" : "Crear" }</Button>
                    &nbsp;&nbsp;
                    <Button onClick={() => {
                        formVariant.resetFields()
                        setLoadingVariants(false)
                        setMutateModalVariants({ visible: false })
                    }}>Cancelar</Button>
                </div>
            </Modal>
        </Container>
    )
}

const PicWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
`

export default Products