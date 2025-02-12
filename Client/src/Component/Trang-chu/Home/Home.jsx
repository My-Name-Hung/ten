import React from "react";
import NavBar from "../Navbar/navBar.jsx";
import Footer from "../../Footer/Footer.jsx";
import Event from "../Event/Event.jsx";


function Home() {
  return (
    <div>
      <NavBar /> {/* Thanh điều hướng */}
      <Event /> {/* DS chương trình */}
      <Footer />
    </div>
  );
}

export default Home;
