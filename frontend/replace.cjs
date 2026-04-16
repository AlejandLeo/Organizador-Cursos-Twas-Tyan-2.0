const fs = require('fs');

const code = `<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEventoStore } from '../../stores/eventoStore';

const router = useRouter();
const route = useRoute();
const eventoStore = useEventoStore();

const isCreating = ref(false);
const currentStep = ref(1);

const tipoActividad = ref('Diplomado');
const nuevoTipoActividad = ref('');

const eventosPublicados = ref([
  {
    id: 1,
    nombreCorto: 'TWAS',
    nombreLargo: 'The World Academy of Sciences',
    version: 'Versión 2026',
    descripcion: 'Eventos del The World Academy of Sciences incluyendo diversas ramas de especialización.',
    imagen: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80',
    estado: 'Evento Activo',
    colorEstado: 'bg-emerald-500 text-white border-emerald-400/30',
    inscripcionesAbiertas: true,
    mostrarActividades: true,
    actividades: [
      {
        id: 1,
        title: 'Programa de Especialidad en Biofertilizantes',
        status: 'En curso',
        type: 'Especialidad',
        date: '15 Mar - 20 Jul 2026',
        students: 45,
        modules: 4,
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
      },
      {
        id: 2,
        title: 'Taller de Redacción APA 7ma Edición',
        status: 'Inscripciones',
        type: 'Taller',
        date: '10 Abr - 15 Abr 2026',
        students: 120,
        modules: 1,
        image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'
      }
    ]
  },
  {
    id: 2,
    nombreCorto: 'Innovación Tecnológica',
    nombreLargo: 'Congreso Internacional de Innovación y Tecnología',
    version: 'Versión 2026',
    descripcion: 'El congreso anual sobre los últimos avances en tecnología global e investigación.',
    imagen: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80',
    estado: 'Próximamente',
    colorEstado: 'bg-umsa-gold text-white border-yellow-400/30',
    inscripcionesAbiertas: false,
    mostrarActividades: true,
    actividades: [
      {
        id: 3,
        title: 'Diplomado en Riego Tecnificado',
        status: 'Finalizado',
        type: 'Diplomado',
        date: '01 Ene - 28 Feb 2026',
        students: 75,
        modules: 6,
        image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80'
      }
    ]
  }
]);

const getStatusColor = (status) => {
  if (status === 'En curso') return 'text-green-600 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800';
  if (status === 'Inscripciones') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};
`;

const toggleActividades = (evento) => {
  evento.mostrarActividades = !evento.mostrarActividades;
};

// ... Wait, toggleActividades needs to be added into the script string.
