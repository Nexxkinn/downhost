document.addEventListener("DOMContentLoaded",init);

async function init() {
    const login   = document.getElementById('login');
    const pass    = document.getElementById('pass');
    const msg     = document.getElementById('msg');

    const notify = ({success,message}) => {
        msg.style.backgroundColor = success ? "#04AA6D" : "#DA1A5F";
        msg.hidden = false;
        msg.innerText = message;
    };

    login.onclick = async (_) => {
        pass.disabled = true;
        login.disabled = true;
        msg.hidden = true;
        const auth = await fetch(`${document.baseURI}login`, {
            method:"POST",
            body: JSON.stringify({"pass":pass.value})
        })

        if(auth.status !== 200){
            pass.disabled = false;
            login.disabled = false;
            const message = auth.status === 401 ? "Wrong username or password" : `${auth.status}:${auth.statusText}`;
            notify({success:false,message});
        }
        else {
            const message = "Successfully signed in. Redirecting...";
            notify({success:true,message});
            window.location.assign(document.baseURI);
        }
    }
    
    pass.addEventListener("keydown", function (e) { if (e.key === 'Enter') { login.click() } });
}

