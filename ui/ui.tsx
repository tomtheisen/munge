import { MungerApp } from './app.js';
import { MungerDocs } from './docs.js';
import { getLibarary } from './lib.js';
import { ProcDocs } from './procdocs.js';

const main = document.querySelector("main")!;
switch (location.search) {
	case "?docs":
		const docs = new MungerDocs;
		main.append(docs.root);
		break;
	case "?proc":
		const procDocs = new ProcDocs;
		main.append(procDocs.root);
		break;
	case "?lib":
		main.append(getLibarary().root);
		break;
	case "?about":
		main.append("Text Munger by Tom Theisen");
		break;
	default:
		const app = new MungerApp;
		app.refs.mungeTitle.title = (document.getElementById("build-date") as HTMLInputElement).value;
		main.append(app.root);
		app.mounted();
}
