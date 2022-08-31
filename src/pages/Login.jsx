import { Button, Form, Input, message } from "antd";
import React, { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import styled from "styled-components";
import { useAuthentication } from "../context/authentication";

const Login = () => {
  const history = useHistory();
  const { doLogin } = useAuthentication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = Form.useForm()[0]

  const onSubmit = async () => {
    const { email, password } = form.getFieldsValue()
    try {
      await doLogin(email, password);
      history.push("/");
    } catch (err) {
      if(err.code === "auth/wrong-password" || err.code === "auth/user-not-found"){
        message.error("Usuario o contraseña incorrectos")
      } else {
        message.error("Ocurrió un problema en el proceso de login")
        console.log(err)
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Wrapper>
      <Card>
        <Form
          layout="vertical"
          form={form}
          onFinish={() => onSubmit()}
        >
          <Form.Item
            type="email"
            rules={[{ required: true, message: "Campo requerido" }]}
            label="Email"
            name="email"
          >
            <Input />
          </Form.Item>
          <Form.Item
            type="password"
            rules={[{ required: true, message: "Campo requerido" }]}
            label="Contraseña"
            name="password"
          >
            <Input.Password />
          </Form.Item>
          <Button 
            type="primary"
            disabled={isSubmitting} 
            loading={isSubmitting}
            onClick={() => form.submit()}
          >
            Acceder
          </Button>
        </Form>
      </Card>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-color: gainsboro;
`

const Card = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1em;
  border-radius: 4px;
  background-color: white;
  box-shadow: 0px 0px 6px 1px rgba(0, 0, 0, 0.1);
`

export default Login
