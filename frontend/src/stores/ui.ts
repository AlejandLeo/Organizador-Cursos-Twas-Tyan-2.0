import { defineStore } from 'pinia';
import { ref, onMounted, onUnmounted } from 'vue';

export const useUIStore = defineStore('ui', () => {
    const isSidebarOpen = ref(window.innerWidth > 1024);
    const isMobile = ref(window.innerWidth <= 1024);

    const toggleSidebar = () => {
        isSidebarOpen.value = !isSidebarOpen.value;
    };

    const closeSidebar = () => {
        if (isMobile.value) {
            isSidebarOpen.value = false;
        }
    };

    const updateDimensions = () => {
        isMobile.value = window.innerWidth <= 1024;
        if (isMobile.value) {
            isSidebarOpen.value = false;
        } else {
            isSidebarOpen.value = true;
        }
    };

    onMounted(() => {
        window.addEventListener('resize', updateDimensions);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', updateDimensions);
    });

    return {
        isSidebarOpen,
        isMobile,
        toggleSidebar,
        closeSidebar
    };
});
