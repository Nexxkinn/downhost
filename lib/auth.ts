import { Context, b64Enc, urljoin } from "../deps.ts";
import { config } from "./_mod.ts";

type session = {
    e:Number,
    t:string
}

const _sessionlist:session[] = [];

export async function AuthMiddleware(ctx:Context,next: ()=> Promise<unknown>) {
    if(!config.pass) return await next();
    const loginurl = config.base_url ? urljoin(config.base_url,'login') : "/login"
    const pathname = ctx.request.url.pathname;
    const auth = await ctx.cookies.get("Token");

    if( pathname === "/login") {
        const status = check(auth);
        if(!status) return await next();
        else {
            ctx.response.body = "Successfully logged in. Redirecting...";
            ctx.response.redirect("../");
        }
    }
    else if(ctx.request.url.pathname.startsWith("/assets/")) {
        return await next();
    }
    else {
        if (!auth) return ctx.response.redirect(loginurl);
        const status = check(auth);
        if(!status) return ctx.response.redirect(loginurl);   
        return await next();
    }
}

export function auth(pass:string) {
    if(!pass) return undefined;
    if(pass === config.pass) {
        const ses = CreateSesion();
        _sessionlist.push(ses);
        return ses.t;
    }
    else return undefined;
}

function CreateSesion() {
    const token = new Uint8Array(64);
    crypto.getRandomValues(token);
    const session_id:session = {
        e: getNumericDate(60*60*24),
        t: b64Enc(token)
    }
    return session_id;
}

function check(session:string | undefined) {
    if (!session) return false;
    const now = getNumericDate(0); 
    const local = _sessionlist.find( x => x.t === session);
    if (!local ) return false;
    if ( local.e <= now ) { 
        _sessionlist.splice(_sessionlist.indexOf(local));
        return false;
    }
    else return true;
}

/*
 * Helper function: getNumericDate()
 * returns the number of seconds since January 1, 1970, 00:00:00 UTC
 */
function getNumericDate(exp: number | Date): number {
    return Math.round(
      (exp instanceof Date ? exp.getTime() : Date.now() + exp * 1000) / 1000,
    );
  }
