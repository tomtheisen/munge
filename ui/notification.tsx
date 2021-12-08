import { RedactioComponent } from 'redactio/jsx-runtime';
import { addStyle } from './style.js';

addStyle(`
	.notification {
		background: #9b9a5c;
		color: #012;
		padding: 0.5em;
		border-radius: 1em;
		margin: 0.5em;
	}
	
	.notification a {
		color: #415;
	}
	
	.notification-close,
	.notification button {
		margin-inline-end: 1em;
		margin-inline-start: 1em;
		cursor: pointer;
	}`);

export class NotificationPop extends RedactioComponent {
	constructor({ timeout } : { timeout?: number }) {
		super(
			<div class="notification">
				<a class="notification-close" onclick={() => this.dismiss()}>✖</a>
			</div>);

		if (timeout) setTimeout(() => this.dismiss(), timeout);
	}

	dismiss() {
		if (this.element.isConnected) {
			this.element.remove();
		}
	}
}
