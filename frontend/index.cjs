const fs = require('fs');
const c = fs.readFileSync('src/views/actividades/ActividadesListView.vue', 'utf8');
const p1 = c.indexOf('VISTA: LISTADO -->');
const p2 = c.indexOf('N (WIZARD) -->');
console.log(c.substring(p1, p2));
