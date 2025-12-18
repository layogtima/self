/* ═══════════════════════════════════════════════════════════════════════════
   BIOMONITOR 3000
   MONO-Inspired Health Dashboard
   Patient: Amit Goyal
   ═══════════════════════════════════════════════════════════════════════════ */

const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    // ═══════════════════════════════════════════════════════════════════════
    // DATA REFS
    // ═══════════════════════════════════════════════════════════════════════
    
    const patient = ref(BIOMONITOR_DATA.patient);
    const vitals = ref(BIOMONITOR_DATA.vitals);
    const systems = ref(BIOMONITOR_DATA.systems);
    const conditions = ref(BIOMONITOR_DATA.conditions);
    const deficiencies = ref(BIOMONITOR_DATA.deficiencies);
    const inflammation = ref(BIOMONITOR_DATA.inflammation);
    const chems = ref(BIOMONITOR_DATA.chems);
    const routine = ref(BIOMONITOR_DATA.routine);
    const upcomingTests = ref(BIOMONITOR_DATA.upcomingTests);
    const bodyRegions = ref(BIOMONITOR_DATA.bodyRegions);
    
    // ═══════════════════════════════════════════════════════════════════════
    // UI STATE
    // ═══════════════════════════════════════════════════════════════════════
    
    const activeTab = ref('stat');
    const hoveredRegion = ref(null);
    const selectedRegion = ref(null);
    const selectedSystem = ref(null);
    const hoveredChem = ref(null);
    
    const tabs = ref([
      { id: 'stat', label: 'STAT' },
      { id: 'chem', label: 'CHEM' },
      { id: 'routine', label: 'ROUTINE' },
      { id: 'tests', label: 'TESTS' }
    ]);
    
    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTED PROPERTIES
    // ═══════════════════════════════════════════════════════════════════════
    
    // Display vitals (subset for main dashboard)
    const displayVitals = computed(() => {
      return {
        hba1c: vitals.value.hba1c,
        hemoglobin: vitals.value.hemoglobin,
        fastingGlucose: vitals.value.fastingGlucose,
        creatinine: vitals.value.creatinine,
        totalCholesterol: vitals.value.totalCholesterol,
        triglycerides: vitals.value.triglycerides
      };
    });
    
    // Current phase tasks
    const currentPhaseTasks = computed(() => {
      const phase = routine.value.phases.find(p => p.phase === routine.value.currentPhase);
      if (!phase) return {};
      return {
        morning: phase.morning,
        afternoon: phase.afternoon,
        evening: phase.evening
      };
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Get CSS class for status color
     */
    const getStatusClass = (status) => {
      const classes = {
        good: 'status-good',
        attention: 'status-attention',
        concern: 'status-concern',
        critical: 'status-critical'
      };
      return classes[status] || 'status-good';
    };
    
    /**
     * Get status label text
     */
    const getStatusLabel = (status) => {
      const labels = {
        good: 'OK',
        attention: 'MONITOR',
        concern: 'CONCERN',
        critical: 'CRITICAL'
      };
      return labels[status] || 'UNKNOWN';
    };
    
    /**
     * Get health score color based on value
     */
    const getHealthScoreColor = (score) => {
      if (score >= 90) return 'text-status-good glow-good';
      if (score >= 75) return 'text-status-attention glow-attention';
      if (score >= 50) return 'text-status-concern glow-concern';
      return 'text-status-critical';
    };
    
    /**
     * Get region info for body diagram
     */
    const getRegionInfo = (regionKey) => {
      const region = bodyRegions.value[regionKey];
      if (!region) return { label: 'Unknown', summary: '' };
      
      // Get related system info
      const relatedSystems = region.systems
        .map(sysKey => systems.value[sysKey])
        .filter(Boolean);
      
      const summaries = relatedSystems.map(sys => sys.summary);
      
      return {
        label: region.label,
        status: region.status,
        summary: summaries.join(' • ') || 'No issues detected'
      };
    };
    
    /**
     * Get CSS class for body region based on status
     */
    const getRegionClass = (regionKey) => {
      const region = bodyRegions.value[regionKey];
      if (!region) return '';
      
      const statusClasses = {
        good: 'region-good',
        attention: 'region-attention',
        concern: 'region-concern',
        critical: 'region-concern'
      };
      
      return statusClasses[region.status] || '';
    };
    
    /**
     * Select a body region
     */
    const selectRegion = (regionKey) => {
      selectedRegion.value = regionKey;
      
      // Find related system and select it
      const region = bodyRegions.value[regionKey];
      if (region && region.systems.length > 0) {
        selectedSystem.value = region.systems[0];
      }
    };
    
    /**
     * Get chem info by ID
     */
    const getChemInfo = (chemId) => {
      return chems.value.find(c => c.id === chemId) || {};
    };
    
    /**
     * Get test priority class
     */
    const getTestPriorityClass = (priority) => {
      const classes = {
        high: 'status-concern',
        medium: 'status-attention',
        low: 'text-mono-muted'
      };
      return classes[priority] || 'text-mono-muted';
    };
    
    /**
     * Get test card class
     */
    const getTestCardClass = (priority) => {
      return `test-card priority-${priority}`;
    };
    
    /**
     * Get test badge class
     */
    const getTestBadgeClass = (priority) => {
      return `badge-${priority}`;
    };
    
    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════
    
    onMounted(() => {
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║   BIOMONITOR 3000 INITIALIZED               ║');
      console.log('║   Patient: ' + patient.value.name.padEnd(40) + '  ║');
      console.log('║   Health Score: ' + patient.value.healthScore + '/100                            ║');
      console.log('║   Status: ONLINE                                      ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      
      // Add staggered animation to panels
      const panels = document.querySelectorAll('.panel');
      panels.forEach((panel, index) => {
        panel.style.opacity = '0';
        panel.style.animation = `slideUp 0.4s ease-out ${index * 0.05}s forwards`;
      });
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // RETURN
    // ═══════════════════════════════════════════════════════════════════════
    
    return {
      // Data
      patient,
      vitals,
      displayVitals,
      systems,
      conditions,
      deficiencies,
      inflammation,
      chems,
      routine,
      currentPhaseTasks,
      upcomingTests,
      bodyRegions,
      
      // UI State
      activeTab,
      tabs,
      hoveredRegion,
      selectedRegion,
      selectedSystem,
      hoveredChem,
      
      // Methods
      getStatusClass,
      getStatusLabel,
      getHealthScoreColor,
      getRegionInfo,
      getRegionClass,
      selectRegion,
      getChemInfo,
      getTestPriorityClass,
      getTestCardClass,
      getTestBadgeClass
    };
  }
}).mount('#app');