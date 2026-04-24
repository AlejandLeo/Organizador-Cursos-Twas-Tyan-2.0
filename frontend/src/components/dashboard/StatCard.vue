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
  const base = "p-6 rounded-[2.5rem] shadow-sm hover:-translate-y-1 transition-all duration-300 border relative overflow-hidden group";
  
  switch (props.variant) {
    case 'primary':
      return `${base} bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 border-blue-100 dark:border-blue-800 shadow-blue-500/5`;
    case 'success':
      return `${base} bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-900 dark:to-emerald-900/10 border-emerald-100 dark:border-emerald-800 shadow-emerald-500/5`;
    case 'warning':
      return `${base} bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-900 dark:to-amber-900/10 border-amber-100 dark:border-amber-800 shadow-amber-500/5`;
    default:
      return `${base} bg-white dark:bg-gray-900 border-slate-100 dark:border-gray-800`;
  }
});

const titleClass = computed(() => {
  if (props.variant === 'primary') return "text-umsa-blue dark:text-blue-400";
  if (props.variant === 'success') return "text-emerald-600 dark:text-emerald-400";
  if (props.variant === 'warning') return "text-amber-600 dark:text-amber-400";
  return "text-slate-500 dark:text-gray-500";
});

const valueClass = computed(() => "text-primary-dark dark:text-white");

const iconClass = computed(() => {
  if (props.variant === 'primary') return "text-umsa-blue/10 dark:text-blue-400/10";
  if (props.variant === 'success') return "text-emerald-600/10 dark:text-emerald-400/10";
  if (props.variant === 'warning') return "text-amber-600/10 dark:text-amber-400/10";
  return "text-slate-100 dark:text-gray-800";
});

const iconColor = computed(() => {
    if (props.variant === 'primary') return "text-umsa-blue dark:text-blue-400";
    if (props.variant === 'success') return "text-emerald-600 dark:text-emerald-400";
    if (props.variant === 'warning') return "text-amber-600 dark:text-amber-400";
    return "text-slate-400 dark:text-gray-600";
});
</script>

<template>
  <div :class="wrapperClass">
    <div class="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <span class="material-symbols-outlined text-6xl" :class="iconColor">
            {{ icon }}
        </span>
    </div>

    <div class="relative z-10">
        <p class="text-[10px] font-black uppercase mb-1 tracking-widest" :class="titleClass">
        {{ title }}
        </p>
        <div class="flex items-end justify-between mt-2">
            <h2 class="text-3xl font-black italic tracking-tighter" :class="valueClass">
                {{ value }}
            </h2>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" :class="iconClass">
                <span class="material-symbols-outlined text-[22px]" :class="iconColor">
                    {{ icon }}
                </span>
            </div>
        </div>
    </div>
  </div>
</template>