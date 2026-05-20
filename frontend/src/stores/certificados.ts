import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

export const useCertificadosStore = defineStore('certificados', () => {
  const misCertificados = ref<any[]>([]);
  const loading = ref(false);

  async function fetchMisCertificados() {
    loading.value = true;
    try {
      const response = await api.get('/me/certificados');
      misCertificados.value = response.data;
    } catch (error) {
      console.error('Error fetching mis certificados:', error);
      Swal.fire('Error', 'No se pudieron cargar tus certificados.', 'error');
    } finally {
      loading.value = false;
    }
  }

  async function descargarCertificado(id: number) {
    try {
      // Indicamos responseType: 'blob' para recibir los datos binarios del PDF
      const response = await api.get(`/me/certificados/${id}/download`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificado_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando certificado:', error);
      Swal.fire('Error', 'No se pudo generar o descargar el certificado.', 'error');
    }
  }

  return {
    misCertificados,
    loading,
    fetchMisCertificados,
    descargarCertificado
  };
});
