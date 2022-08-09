import React from "react";
import { useAuthentication } from "../context/authentication";
import { useHistory, Link } from "react-router-dom";

const Home = () => {
  const history = useHistory();
  const { doLogout, user } = useAuthentication();

  const logout = async () => {
    await doLogout();
    history.push("/login");
  };

  return (
    <>
      <h1>Holas {user?.email} :)</h1>
      <div>
        <Link to="/eventos"><button>Eventos</button></Link>
        <Link to="/productos"><button>Productos</button></Link>
      </div>
      <button onClick={logout} type="button">
        Logout
      </button>
    </>
  );
};

export default Home
