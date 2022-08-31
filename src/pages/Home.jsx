import React from "react";
import { useAuthentication } from "../context/authentication";
import { Link } from "react-router-dom";
import { Container } from "../components";
import styled from "styled-components";

const Home = () => {
  const { user } = useAuthentication();

  return (
    <Container>
      <h3>Ale {user?.email}, a vender mucho :)</h3>
      <BtnWrapper>
          <Link to="/eventos"><BigSquare>Eventos</BigSquare></Link>
          <Link to="/reservas"><BigSquare>Reservas</BigSquare></Link>
          <Link to="/productos"><BigSquare>Productos</BigSquare></Link>
      </BtnWrapper>
    </Container>
  );
};

const BtnWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: 1em;
`

const BigSquare = styled.div`
  height: 125px;
  width: 125px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  border: 1px solid gainsboro;
  border-radius: 4px;
  box-shadow: 0 0 6px 1px rgba(0, 0, 0, 0.05);
  margin: 0.5em;
  color: #232323;
  font-size: 1.6em;
`

export default Home
