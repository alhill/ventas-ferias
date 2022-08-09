import React, { useState } from "react";
import { Redirect, Switch, Route } from "react-router-dom";
import { Home, Login, Register, Products, Events, Event, NewSale, EventStatus } from "./pages"
import { useAuthentication } from "./context/authentication";

export const App = () => {
  const { isFetchingUser, isLogged } = useAuthentication();

  if (!isLogged && isFetchingUser) return <h1>Cargando...</h1>;

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
      <Route path="/eventos/:id/resumen" exact><EventStatus /></Route>
      <Route path="/eventos/:id" exact><Event /></Route>
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
