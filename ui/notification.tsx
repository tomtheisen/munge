import { RedactioComponent } from "redactio/jsx-runtime";

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
