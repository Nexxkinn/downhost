import { render } from "../lib/_mod.ts";

const title = "Login : Downhost";

export default async function handler(){
    return await render("login.html",{title})
}
