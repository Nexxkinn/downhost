import { render } from 'solid-js/web';
import { onMount } from 'solid-js';
import styles from '../styles/login.css';
import {
    fastButton,
	fastTextField,
    baseLayerLuminance,
    provideFASTDesignSystem
} from "@microsoft/fast-components";


function LoginPage() {
	let login,pass,msg;
	onMount(() => {
		provideFASTDesignSystem()
			.register(
				fastTextField(),
				fastButton()
			)

		baseLayerLuminance.setValueFor(document, 0.1);

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
				const message = auth.status === 401 ? "Wrong password" : `${auth.status}:${auth.statusText}`;
				notify({success:false,message});
			}
			else {
				const message = "Successfully signed in. Redirecting...";
				notify({success:true,message});
				window.location.assign(document.baseURI);
			}
		}

		pass.addEventListener("keydown", function (e) { if (e.key === 'Enter') { login.click() } });
	})

	return <>
		<div class="panel">
			<div class="form">
				<fast-text-field ref={pass} appearance="outline" placeholder="password" type="password"></fast-text-field>
				<fast-button ref={login}>Login</fast-button>
			</div>
			<div class="msg" ref={msg} hidden></div>
		</div>
	</>;
}

render(() => <LoginPage class={styles}/>, document.getElementById('root') as HTMLElement);
