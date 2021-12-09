import { MungerApp } from './app.js';
import { MungerDocs } from './docs.js';
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
	case "?about":
		main.append("Text Munger by Tom Theisen");
		break;
	case "?lib":
		main.append((
			<>
				<h1>Classic Mungers</h1>
				<p>Here's some I prepared earlier.</p>

				<h2>Encoding</h2>
				<ul>
					<li>
						<a href="?#eyJtIjoiLy57MSwzfS9zID0+ICMoXG5cdGZ4IHsgXyBsZW4gc2V0KGJsb2NrbGVuKSB9XG4gICAgeyBfIDMgcnBhZCB9XG5cdC8uL3MgPT4geyBfIG9yZCBcIiBcIiB9XG5cdEAgLyhcXGQrKSAoXFxkKykvID0+IHsgJDEgMjU2ICogJDIgKyB9XG5cdEAgL1xcZHszLH0vID0+IHsgXyA2NCAvIGZsb29yIFwiIFwiIF8gNjQgJSB9XG5cdC9cXGQrXFxzKi8gPT4ge1xuXHRcdFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrL1wiXG5cdFx0XyBza2lwIDEgdGFrZVxuXHR9XG5cdHsgXyBnZXQoYmxvY2tsZW4pIDEgKyB0YWtlIDQgcnBhZCB9XG5cdCcgJyA9PiBcIj1cIlxuKSIsImkiOiJIZWxsbywgV29ybGQhIn0=">
							ASCII to Base-64</a>
					</li>
					<li>
						<a href="?#eyJtIjoiLy57NH0vID0+ICMoXG5cdC8uLyA9PiB7IFxuXHRcdFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrL1wiIFxuXHRcdF8gaW5kZXggMCBtYXggXCIgXCIgXG5cdH1cblx0QCAxKC8oXFxkKykgKFxcZCspLyA9PiB7ICQxIDY0ICogJDIgKyB9KVxuXHRAIC9cXGR7NCx9LyA9PiB7IF8gMjU2IC8gZmxvb3IgIFwiIFwiIF8gMjU2ICUgfVxuXHQvXFxkK1xccyovID0+IHsgXyBjaHIgfVxuKSIsImkiOiJTR1ZzYkc4c0lGZHZjbXhrSVM9PSJ9">
							Base-64 to ASCII</a>
					</li>
				</ul>

				<h2>CSV</h2>
				<ul>
					<li>
						<a href="?#eyJtIjoiIyhcblx0KFxuXHRcdC9eL20gPT4gZnggeyBpbmMobGluZSkgfVxuXHRcdC9cIihcIlwifFteXCJdKSpcIiw/LyA9PiAjKFxuXHRcdFx0L15cInxcIiwkfFwiKFwiKS8gPT4geyAkMSB9XG5cdFx0XHQnXFxuJyA9PiBcIlx1MjFiNVwiXG5cdFx0XHR7IF8gXCJsaW5lXCIgZ2V0KGxpbmUpIGNhdCBwdXNoIH1cblx0XHQpXG5cdFx0LyhbXixcIlxcbl0qKSw/LyA9PiB7ICQxIFwibGluZVwiIGdldChsaW5lKSBjYXQgcHVzaCB9XG5cdClcblx0Ly4rLyA9PiBcIlwiXG5cdEAjKFxuXHRcdGZ4IHsgMCBzZXQobGluZSkgc2V0KHdpZHRoKSBlbXB0eSh0aGlzY29sKSB9XG5cdFx0LyQvbSA9PiBmeCB7XG5cdFx0XHRpbmMobGluZSlcblx0XHRcdFwibGluZVwiIGdldChsaW5lKSBjYXQgdW5jb25zXG5cdFx0XHRjb3B5IGxlbiBnZXQod2lkdGgpIG1heCBzZXQod2lkdGgpIGRyb3Bcblx0XHRcdHB1c2godGhpc2NvbClcblx0XHR9XG5cdFx0LyQvbSA9PiB7XG5cdFx0XHRnZXQod2lkdGgpIGlmIHsgXCJcdTI1MDIgXCIgfSBcblx0XHRcdHVuY29ucyh0aGlzY29sKSBnZXQod2lkdGgpIHJwYWQgXG5cdFx0XHRnZXQod2lkdGgpIGlmIHsgXCIgXCIgfSBcblx0XHR9XG5cdClcbikiLCJpIjoiWWVhcixNYWtlLE1vZGVsLERlc2NyaXB0aW9uLFByaWNlXG4xOTk3LEZvcmQsRTM1MCxcImFjLCBhYnMsIG1vb25cIiwzMDAwLjAwXG4xOTk5LENoZXZ5LFwiVmVudHVyZSBcIlwiRXh0ZW5kZWQgRWRpdGlvblwiXCJcIixcIlwiLDQ5MDAuMDBcbjE5OTksQ2hldnksXCJWZW50dXJlIFwiXCJFeHRlbmRlZCBFZGl0aW9uLCBWZXJ5IExhcmdlXCJcIlwiLCw1MDAwLjAwXG4xOTk2LEplZXAsR3JhbmQgQ2hlcm9rZWUsXCJNVVNUIFNFTEwhXG5haXIsIG1vb24gcm9vZiwgbG9hZGVkXCIsNDc5OS4wMCJ9">
							Decode and column-align CSV</a>
					</li>
				</ul>
			</>).root);
			break;
	default:
		const app = new MungerApp;
		app.refs.mungeTitle.title = (document.getElementById("build-date") as HTMLInputElement).value;
		main.append(app.root);
		app.mounted();
}
