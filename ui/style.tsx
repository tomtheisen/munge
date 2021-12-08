export function addStyle(styles: string) {
   document.head.append((<style>{ styles.replace(/\s+/g, ' ') }</style>).root); 
}