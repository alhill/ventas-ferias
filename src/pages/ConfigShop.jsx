import { getDoc, query, collection, getDocs, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Container, PicSquare } from '../components'
import { useFirebase } from '../context/firebase'
import { Button, Form, Upload, message } from 'antd'
import { useParams, Link } from 'react-router-dom'
import styled from 'styled-components'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { PlusOutlined } from '@ant-design/icons'
import _ from 'lodash'

const ConfigShop = () => {

    const { firestore, storage } = useFirebase()

    const [products, setProducts] = useState([])
    const [tags, setTags] = useState([])
    const [bannerPics, setBannerPics] = useState([])
    const [initialBannerPics, setInitialBannerPics] = useState([])

    useEffect(() => {
        const unsubscribeProducts = onSnapshot(
            query(collection(firestore, "products")),
            qs => {
                const products = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setProducts(products)
            }
        );

        (async () => {
            const config = (await getDoc(doc(collection(firestore, "config"), "1"))).data()
            const tags = config?.tags || []
            const bannerPics = config?.bannerPics || []

            setBannerPics(bannerPics)
            setInitialBannerPics(bannerPics)
            setTags(tags)
        })()

        return () => unsubscribeProducts()
    }, [])

    const saveBannerPics = async () => {
        const picsToDelete = _.xor(
            bannerPics.map(p => p.route),
            initialBannerPics.map(p => p.route)
        )

        for (const picToDelete of picsToDelete){
            try{
                const deleteRef = ref(storage, picToDelete);
                await deleteObject(deleteRef)
            } catch(err) {
                console.error(`${picToDelete} cannot be deleted`)
            }
            
        }

        try{
            await updateDoc(doc(collection(firestore, "config"), "1"), {
                bannerPics
            })
            message.success("Se han guardado correctamente las imágenes del banner")
        } catch(err) {
            console.error(err)
            message.error("Ocurrió un error al guardar las imágenes del banner")
        }
    }


    return (
        <Container>
            <h2>Configuración de la tienda</h2>

            <Form
                layout="vertical"
            >
                <Form.Item
                    label="Imágenes del banner principal"
                >
                    <PicWrapper>
                        {bannerPics.map((pic, i) => {
                            return <PicSquare
                                picList={bannerPics}
                                setPicList={setBannerPics}
                                pic={pic}
                                idx={i}
                                key={`pic-${i}`}
                                destacada={false}
                            />
                        })}  
                        <Upload
                            name="file"
                            customRequest={async evt => {
                                const fullName = evt?.file?.name
                                const ext = fullName.split(".").slice(-1)[0]
                                const fileName = `${fullName.split(".").slice(0, -1).join(".")}-${new Date().getTime()}.${ext}`

                                if(["jpg", "jpeg", "png", "webp"].includes(ext)){
                                    const route = "bannerImg/" + fileName
                                    const newImgRef = ref(storage, route)
                                    try{
                                        const uploaded = await uploadBytes(newImgRef, evt.file)
                                        const url = await getDownloadURL(uploaded.ref)
                                        setBannerPics([
                                            ...bannerPics,
                                            { url, route }
                                        ])
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
                    <Button onClick={() => saveBannerPics()}>Guardar banner</Button>
                </Form.Item>
            </Form>
            
        </Container>
    )
}

const BtnWrapper = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-evenly;
`

const PicWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
`

export default ConfigShop