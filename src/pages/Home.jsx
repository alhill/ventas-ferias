import React from "react";
import { useAuthentication } from "../context/authentication";
import { useHistory } from "react-router-dom";

const Home = () => {
  const { push } = useHistory();
  const { doLogout, user } = useAuthentication();

  const logout = async () => {
    await doLogout();

    push("/login");
  };

  return (
    <>
      <h1>Holas {user?.email} :)</h1>
      <button onClick={logout} type="button">
        Logout
      </button>
    </>
  );
};

export default Home
