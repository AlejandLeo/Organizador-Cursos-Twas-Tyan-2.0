$content = Get-Content src/views/actividades/ActividadesListView.vue -Raw
$content -replace '(?s)const openDetalleCurso = \(courseId: any\).*?  };', "const openDetalleCurso = (courseId: any) => {
    if (route.name === 'coordinador-estudiantes-global') {
      router.push({ path: `/coordinador/actividades/${courseId}`, query: { tab: 'estudiantes' } });
    } else if (route.name === 'coordinador-ponentes-global') {
      router.push({ path: `/coordinador/actividades/${courseId}`, query: { tab: 'ponentes' } });
    } else {
      router.push({ path: `/coordinador/actividades/${courseId}` });
    }
  };" | Set-Content src/views/actividades/ActividadesListView.vue
