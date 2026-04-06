<script setup lang="ts">
// Vista global de ponentes
</script>
<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6">
      <h2 class="text-4xl font-black text-primary-dark dark:text-white tracking-tighter uppercase italic">Directorio de Ponentes</h2>
      <button class="bg-primary-dark text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-umsa-gold transition-all flex items-center gap-2">
        <span class="material-symbols-outlined text-sm">person_add</span> Registrar Ponente
      </button>
    </div>
    <div class="relative w-full max-w-md group">
      <span class="absolute inset-y-0 left-4 flex items-center text-slate-400"><span class="material-symbols-outlined">search</span></span>
      <input class="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl text-sm font-bold text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-gold outline-none transition-all" placeholder="Buscar por Nombre o Especialidad..." type="text">
    </div>
    <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
          <tr><th class="px-8 py-5">Perfil Ponente</th><th class="px-8 py-5">Cédula Identidad</th><th class="px-8 py-5">Especialidad</th><th class="px-8 py-5 text-center">Firma Digital</th><th class="px-8 py-5 text-center">Acciones</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
          <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
            <td class="px-8 py-6">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full border-2 border-umsa-gold bg-slate-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  <span class="material-symbols-outlined text-slate-400">person</span>
                </div>
                <div><p class="font-black text-primary-dark dark:text-white text-sm uppercase">Dr. Juan Carlos Mamani</p><p class="text-[10px] text-blue-500 font-medium italic">jcmamani@umsa.bo</p></div>
              </div>
            </td>
            <td class="px-8 py-6 text-xs font-bold text-slate-500 dark:text-gray-400">8432190 LP</td>
            <td class="px-8 py-6 text-xs font-bold text-primary-dark dark:text-white uppercase">Microbiología Agrícola</td>
            <td class="px-8 py-6 text-center"><span class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Cargada</span></td>
            <td class="px-8 py-6 flex justify-center gap-2">
              <button class="p-2 border border-blue-200 dark:border-blue-900 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">edit</span></button>
              <button class="p-2 border border-red-200 dark:border-red-900 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">delete</span></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>