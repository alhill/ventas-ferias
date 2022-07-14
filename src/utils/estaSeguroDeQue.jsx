import React from 'react'
import { Input, Modal, Form, Button, message } from 'antd'
import { capitalize } from 'lodash'
import { ExclamationCircleOutlined } from '@ant-design/icons'

//Enola Gay, is mother proud of little boy today? 
const estaSeguroDeQue = ({ desea, esto, title, text, bypass, loading, safer, field, cancelText, fn }) => {

    const compare = safer ? (desea + " " + esto).toLocaleUpperCase() : ""

    if(!bypass){
        Modal.confirm({
            className: "customConfirm",
            icon: <ExclamationCircleOutlined color="#FFAB24" />,
            title: title ? title : `¿Está seguro de que desea ${desea} ${esto}?`,
            content: <div>
                <p>{text}</p>
                { safer && <>
                    <br />
                    <p>Si quieres continuar, escribe "{compare}" en el campo que tienes a continuación</p>
                    <Form.Item>
                        <Input onChange={evt => field.current = evt.target.value}/>
                    </Form.Item>
                </>}
                <br />
                <div style={{ display: "flex", justifyContent: "flex-end"}}>
                    <Button style={{ marginRight: "1em" }} onClick={() => Modal.destroyAll()}>{cancelText || "Cancelar"}</Button>
                    <Button type="primary" onClick={() => {
                        if(safer){
                            if(!field){
                                throw new Error("Para usar la opción safer hay que pasar un ref de tipo string en el prop field `const fieldRef = useRef<string>(\"\")`")
                            }
                            if(compare === (field.current || "").toLocaleUpperCase()){
                                fn()
                                field.current = ""
                                Modal.destroyAll()
                            } else {
                                message.warning("Introduzca el texto de confirmación")
                            }
                        } else {
                            fn()
                            Modal.destroyAll()
                        }
                    }}>{ capitalize(desea) || "Aceptar" }</Button>
                </div>
            </div>,
            onOk: () => {},
            okButtonProps: { loading }
        })
    } else {
        fn()
    }
}

export default estaSeguroDeQue