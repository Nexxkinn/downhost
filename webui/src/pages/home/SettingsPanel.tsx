export const SettingsPanel = () => {
	<fast-dialog id="settings-dialog" modal hidden>
		<div class="settings-dialog">
			<h2>Settings</h2>
			<span>Theme</span>
			<fast-switch id="switch-theme">
				<span slot="checked-message">Light</span>
				<span slot="unchecked-message">Dark</span>
			</fast-switch> <br />
			<span>To be added later.</span> <br />
			<fast-button id="dialog-close">Close</fast-button>
			<h2>About</h2>
			<div>DownHost v. 0.0.1</div>
		</div>
	</fast-dialog>
}
