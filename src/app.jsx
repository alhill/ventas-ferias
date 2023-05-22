import React from "react";
import { Redirect, Switch, Route } from "react-router-dom";
import { Home, Login, Register, Products, Events, Event, NewSale, EventStatus, Reservations, ConfigShop } from "./pages"
import { useAuthentication } from "./context/authentication";
import { Spin } from "antd";

export const App = () => {
  const { isFetchingUser, isLogged } = useAuthentication();

  if (!isLogged && isFetchingUser) return (
      <div style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h3>Cargando</h3>
          <Spin />
        </div>
      </div>
  )

  return isLogged ? <AuthenticatedApp /> : <UnauthenticatedApp />;
};

const AuthenticatedApp = () => {
  const { isLogged } = useAuthentication();

  if (!isLogged) return <Redirect to="/login" />;

  return (
    <Switch>
      <Route path="/productos" exact><Products /></Route>
      <Route path="/eventos" exact><Events /></Route>
      <Route path="/eventos/:id/nueva-venta" exact><NewSale /></Route>
      <Route path="/nueva-reserva" exact><NewSale /></Route>
      <Route path="/eventos/:id/resumen" exact><EventStatus /></Route>
      <Route path="/eventos/:id" exact><Event /></Route>
      <Route path="/reservas" exact><Reservations /></Route>
      <Route path="/tienda" exact><ConfigShop /></Route>
      <Route path="/" exact><Home /></Route>
      <Route path="*">Error 404 - Page not found!</Route>
    </Switch>
  );
};

const UnauthenticatedApp = () => {
  return (
    <Switch>
      <Route exact path={["/", "/login"]}>
        <Login />
      </Route>
      <Route exact path="/register">
        <Register />
      </Route>
    </Switch>
  );
};
