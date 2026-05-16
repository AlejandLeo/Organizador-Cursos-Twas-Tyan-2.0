import { defineStore } from 'pinia';
import { ref, onMounted, onUnmounted } from 'vue';

export const useUIStore = defineStore('ui', () => {
    const isSidebarOpen = ref(window.innerWidth > 1024);
    const isMobile = ref(window.innerWidth <= 1024);
    const isDark = ref(localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches));

    const toggleSidebar = () => {
        isSidebarOpen.value = !isSidebarOpen.value;
    };

    const toggleTheme = () => {
        isDark.value = !isDark.value;
        const theme = isDark.value ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        applyTheme();
    };

    const applyTheme = () => {
        if (isDark.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
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

    const isServerOnline = ref(true);

    const setServerStatus = (status: boolean) => {
        isServerOnline.value = status;
    };

    onMounted(() => {
        window.addEventListener('resize', updateDimensions);

        applyTheme();
    });

    onUnmounted(() => {
        window.removeEventListener('resize', updateDimensions);
    });

    return {
        isSidebarOpen,
        isMobile,
        isDark,
        isServerOnline,
        toggleSidebar,
        toggleTheme,
        closeSidebar,
        setServerStatus
    };
});
