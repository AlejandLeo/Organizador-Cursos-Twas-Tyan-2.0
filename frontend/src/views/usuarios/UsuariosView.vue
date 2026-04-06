<script setup lang="ts">
const openModal = (modalId: string) => {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'flex';
};
const closeModal = (modalId: string) => {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'none';
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
        <div>
            <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Gesti�n de Usuarios</h2>
            <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Control de acceso y roles al sistema</p>
        </div>
        <button @click="openModal('modal-usuario')" class="bg-primary-dark text-white px-6 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-umsa-gold hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">person_add</span> Nuevo Usuario
        </button>
    </div>

    <!-- Buscador -->
    <div class="relative w-full max-w-md group">
        <label class="absolute -top-3 left-6 px-2 bg-[#f8f9fc] dark:bg-black z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest italic transition-colors">Buscar por nombre o correo</label>
        <span class="absolute inset-y-0 left-5 flex items-center text-slate-400">
            <span class="material-symbols-outlined text-xl group-focus-within:text-umsa-blue transition-colors">search</span>
        </span>
        <input class="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-full shadow-sm text-sm focus:ring-4 focus:ring-umsa-blue/10 focus:border-umsa-blue outline-none transition-all font-bold text-primary-dark dark:text-gray-200 placeholder-slate-400" placeholder="Ingresa tu b�squeda..." type="text">
    </div>

    <!-- Tabla -->
    <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
        <table class="w-full text-left">
            <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                <tr><th class="px-8 py-5">Nombre Completo</th><th class="px-8 py-5">Correo Electr�nico</th><th class="px-8 py-5 text-center">Rol Sistema</th><th class="px-8 py-5 text-center">Acciones</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                    <td class="px-8 py-6 font-black text-primary-dark dark:text-white uppercase text-sm">Alejandro Morales</td>
                    <td class="px-8 py-6 text-xs font-bold text-slate-500 dark:text-gray-400">amorales@umsa.bo</td>
                    <td class="px-8 py-6 text-center"><span class="bg-umsa-gold/20 text-umsa-gold px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Coordinador</span></td>
                    <td class="px-8 py-6 flex justify-center gap-2">
                        <button @click="openModal('modal-usuario')" class="p-2 border border-blue-200 dark:border-blue-900 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">edit</span></button>
                        <button class="p-2 border border-red-200 dark:border-red-900 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">delete</span></button>
                    </td>
                </tr>
                <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                    <td class="px-8 py-6 font-black text-primary-dark dark:text-white uppercase text-sm">Luc�a Fern�ndez</td>
                    <td class="px-8 py-6 text-xs font-bold text-slate-500 dark:text-gray-400">lfernandez@umsa.bo</td>
                    <td class="px-8 py-6 text-center"><span class="bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-gray-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Administrador</span></td>
                    <td class="px-8 py-6 flex justify-center gap-2">
                        <button @click="openModal('modal-usuario')" class="p-2 border border-blue-200 dark:border-blue-900 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">edit</span></button>
                        <button class="p-2 border border-red-200 dark:border-red-900 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">delete</span></button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Modal Formulario Usuario -->
    <div id="modal-usuario" class="fixed inset-0 bg-primary-dark/80 z-[200] hidden items-center justify-center backdrop-blur-sm">
        <div class="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-lg p-10 shadow-2xl">
            <div class="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-gray-800 pb-4">
                <h3 class="text-2xl font-black text-primary-dark dark:text-white italic uppercase">Formulario Usuario</h3>
                <button @click="closeModal('modal-usuario')" class="text-slate-400 hover:text-red-500 transition-colors"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div class="space-y-5">
                <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label><input type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
                <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electr�nico</label><input type="email" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol en Sistema</label>
                        <select class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10">
                            <option>Coordinador</option><option>Administrador</option><option>Visualizador</option>
                        </select>
                    </div>
                    <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrase�a Temp.</label><input type="password" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
                </div>
            </div>
            <div class="mt-8 flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-gray-800">
                <button @click="closeModal('modal-usuario')" class="px-6 py-3 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl">Cancelar</button>
                <button @click="closeModal('modal-usuario')" class="px-8 py-3 bg-primary-dark text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-umsa-gold shadow-lg hover:-translate-y-0.5 transition-all">Guardar</button>
            </div>
        </div>
    </div>
  </div>
</template>
