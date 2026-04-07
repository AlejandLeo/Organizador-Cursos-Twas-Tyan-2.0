<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  value: string | number;
  icon: string;
  variant?: 'primary' | 'success' | 'warning' | 'info';
}>();

// Estilos dinámicos basados en la variable variant
const wrapperClass = computed(() => {
  const base = "p-6 rounded-[2rem] shadow-sm hover:-translate-y-1 transition-transform border-l-4";
  
  switch (props.variant) {
    case 'primary':
      return `${base} bg-primary-dark dark:bg-blue-900 border-primary-dark dark:border-blue-900 border-b-4 border-b-umsa-gold dark:border-b-blue-400 border-l-transparent text-white shadow-lg`;
    case 'success':
      return `${base} bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 border-l-green-500`;
    default:
      // info or default
      return `${base} bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 border-l-primary-dark dark:border-l-blue-500`;
  }
});

const titleClass = computed(() => {
  if (props.variant === 'primary') return "text-umsa-gold dark:text-blue-300";
  return "text-slate-400 dark:text-gray-400";
});

const valueClass = computed(() => {
  if (props.variant === 'primary') return "text-white italic";
  if (props.variant === 'success') return "text-green-600 dark:text-green-400";
  return "text-primary-dark dark:text-white";
});

const iconClass = computed(() => {
  if (props.variant === 'primary') return "text-white/20";
  if (props.variant === 'success') return "text-green-100 dark:text-green-900/30";
  return "text-slate-200 dark:text-gray-700";
});
</script>

<template>
  <div :class="wrapperClass">
    <p class="text-[10px] font-bold uppercase mb-2 tracking-widest" :class="titleClass">
      {{ title }}
    </p>
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-black" :class="valueClass">
        {{ value }}
      </h2>
      <span class="material-symbols-outlined text-3xl" :class="iconClass">
        {{ icon }}
      </span>
    </div>
  </div>
</template>