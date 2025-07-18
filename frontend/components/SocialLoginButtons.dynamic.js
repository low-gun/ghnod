import dynamic from "next/dynamic";
export default dynamic(() => import("./SocialLoginButtons"), { ssr: false });