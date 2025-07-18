// /pages/login.js
import dynamic from "next/dynamic";
export default dynamic(() => import("../components/LoginPage"), { ssr: false });
