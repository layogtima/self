/**
 * FERMENT - MediaPicker Component
 * Rich image/video upload: drag & drop, file picker, camera capture (mobile), URL paste
 * Images stored as data URIs in localStorage for localhost persistence
 */

const MediaPickerComponent = {
  name: 'media-picker',

  props: {
    modelValue: { type: Array, default: () => [] },
    mediaType: { type: String, default: 'image' }, // 'image' or 'video'
    maxItems: { type: Number, default: 10 },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      items: JSON.parse(JSON.stringify(this.modelValue || [])),
      urlInput: '',
      showUrlInput: false,
      draggingOver: false,
      dragIndex: null,
    };
  },

  watch: {
    modelValue: {
      handler(v) { this.items = JSON.parse(JSON.stringify(v || [])); },
      deep: true
    }
  },

  computed: {
    isMobile() {
      return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    },
    canAdd() {
      return this.items.length < this.maxItems;
    },
  },

  methods: {
    save() {
      this.$emit('update:modelValue', JSON.parse(JSON.stringify(this.items)));
    },

    // File picker
    openFilePicker() {
      this.$refs.fileInput.click();
    },

    onFileSelect(e) {
      const files = Array.from(e.target.files || []);
      files.forEach(file => this.processFile(file));
      e.target.value = '';
    },

    // Camera capture (mobile)
    openCamera() {
      this.$refs.cameraInput.click();
    },

    onCameraCapture(e) {
      const files = Array.from(e.target.files || []);
      files.forEach(file => this.processFile(file));
      e.target.value = '';
    },

    // Drag and drop
    onDragEnter(e) {
      e.preventDefault();
      this.draggingOver = true;
    },
    onDragLeave(e) {
      e.preventDefault();
      this.draggingOver = false;
    },
    onDrop(e) {
      e.preventDefault();
      this.draggingOver = false;
      const files = Array.from(e.dataTransfer.files || []);
      files.forEach(file => this.processFile(file));
    },

    processFile(file) {
      if (!this.canAdd) return;

      if (this.mediaType === 'image' && !file.type.startsWith('image/')) return;
      if (this.mediaType === 'video' && !file.type.startsWith('video/')) return;

      // Convert to data URI for localStorage persistence
      const reader = new FileReader();
      reader.onload = (e) => {
        this.items.push({
          url: e.target.result,
          caption: file.name.replace(/\.[^.]+$/, ''),
          attribution: 'Local upload',
          type: this.items.length === 0 ? 'hero' : 'gallery',
          alt: file.name,
          isLocal: true,
        });
        this.save();
      };

      // For images, resize if too large (max 800px width for localStorage)
      if (this.mediaType === 'image' && file.size > 500000) {
        this.resizeImage(file, 800, (dataUri) => {
          this.items.push({
            url: dataUri,
            caption: file.name.replace(/\.[^.]+$/, ''),
            attribution: 'Local upload',
            type: this.items.length === 0 ? 'hero' : 'gallery',
            alt: file.name,
            isLocal: true,
          });
          this.save();
        });
      } else {
        reader.readAsDataURL(file);
      }
    },

    resizeImage(file, maxWidth, callback) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.8));
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },

    // URL input
    addFromUrl() {
      if (!this.urlInput.trim() || !this.canAdd) return;

      if (this.mediaType === 'video') {
        this.items.push({
          url: this.urlInput.trim(),
          title: '',
          channel: '',
          type: this.urlInput.includes('youtube') ? 'youtube' : this.urlInput.includes('vimeo') ? 'vimeo' : 'local',
        });
      } else {
        this.items.push({
          url: this.urlInput.trim(),
          caption: '',
          attribution: '',
          type: this.items.length === 0 ? 'hero' : 'gallery',
          alt: '',
        });
      }

      this.urlInput = '';
      this.showUrlInput = false;
      this.save();
    },

    removeItem(index) {
      this.items.splice(index, 1);
      this.save();
    },

    updateCaption(index, caption) {
      this.items[index].caption = caption;
      this.save();
    },

    // Reorder
    onItemDragStart(index) { this.dragIndex = index; },
    onItemDragOver(e, index) {
      e.preventDefault();
      if (this.dragIndex !== null && this.dragIndex !== index) {
        const item = this.items.splice(this.dragIndex, 1)[0];
        this.items.splice(index, 0, item);
        this.dragIndex = index;
        this.save();
      }
    },
    onItemDragEnd() { this.dragIndex = null; },

    youtubeThumb(url) {
      const match = url && url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
    },
  },

  template: `
    <div class="media-picker space-y-3">
      <!-- Drop Zone -->
      <div v-if="canAdd && mediaType === 'image'"
        @dragenter="onDragEnter"
        @dragover.prevent
        @dragleave="onDragLeave"
        @drop="onDrop"
        :class="['border-2 border-dashed rounded-xl p-6 text-center transition-colors',
          draggingOver ? 'border-accent-brine bg-accent-brine/5' : 'border-bg-secondary dark:border-dark-secondary hover:border-accent-brine/30']">
        <svg class="w-8 h-8 mx-auto text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p class="text-sm text-text-muted mb-3">Drop images here</p>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button @click="openFilePicker"
            class="text-xs bg-accent-brine/10 text-accent-aged dark:text-accent-brine hover:bg-accent-brine/20 px-3 py-1.5 rounded-lg font-medium transition-colors">
            📁 Choose File
          </button>
          <button v-if="isMobile" @click="openCamera"
            class="text-xs bg-accent-culture/10 text-accent-culture hover:bg-accent-culture/20 px-3 py-1.5 rounded-lg font-medium transition-colors">
            📷 Take Photo
          </button>
          <button @click="showUrlInput = !showUrlInput"
            class="text-xs bg-bg-secondary dark:bg-dark-secondary text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg font-medium transition-colors">
            🔗 Paste URL
          </button>
        </div>
      </div>

      <!-- Video add buttons -->
      <div v-if="canAdd && mediaType === 'video'" class="flex flex-wrap gap-2">
        <button @click="showUrlInput = !showUrlInput"
          class="text-xs bg-accent-brine/10 text-accent-aged dark:text-accent-brine hover:bg-accent-brine/20 px-3 py-1.5 rounded-lg font-medium transition-colors">
          🔗 Add Video URL
        </button>
      </div>

      <!-- URL Input -->
      <div v-if="showUrlInput" class="flex gap-2">
        <input v-model="urlInput" :placeholder="mediaType === 'video' ? 'YouTube or video URL...' : 'Image URL...'"
          @keydown.enter="addFromUrl"
          class="flex-1 px-3 py-2 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-lg text-sm focus:outline-none focus:border-accent-brine">
        <button @click="addFromUrl"
          class="px-3 py-2 bg-accent-brine/10 text-accent-aged dark:text-accent-brine rounded-lg text-sm font-medium hover:bg-accent-brine/20 transition-colors">
          Add
        </button>
      </div>

      <!-- Hidden file inputs -->
      <input ref="fileInput" type="file" :accept="mediaType === 'image' ? 'image/*' : 'video/*'" multiple class="hidden" @change="onFileSelect">
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onCameraCapture">

      <!-- Thumbnails -->
      <div v-if="items.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <div v-for="(item, index) in items" :key="index"
          :draggable="true"
          @dragstart="onItemDragStart(index)"
          @dragover="onItemDragOver($event, index)"
          @dragend="onItemDragEnd"
          :class="['group relative rounded-lg overflow-hidden border transition-all',
            dragIndex === index ? 'border-accent-brine ring-2 ring-accent-brine/20' : 'border-bg-secondary dark:border-dark-secondary']">

          <!-- Image thumbnail -->
          <template v-if="mediaType === 'image'">
            <img :src="item.url" :alt="item.alt || item.caption || ''" class="w-full h-24 object-cover">
          </template>

          <!-- Video thumbnail -->
          <template v-else>
            <img v-if="youtubeThumb(item.url)" :src="youtubeThumb(item.url)" class="w-full h-24 object-cover">
            <div v-else class="w-full h-24 bg-bg-secondary dark:bg-dark-secondary flex items-center justify-center">
              <span class="text-2xl">▶️</span>
            </div>
          </template>

          <!-- Type badge -->
          <span v-if="item.type === 'hero'" class="absolute top-1 left-1 text-[10px] bg-accent-brine text-white px-1.5 py-0.5 rounded font-medium">Hero</span>

          <!-- Remove button -->
          <button @click="removeItem(index)"
            class="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
            ×
          </button>

          <!-- Caption (editable) -->
          <input v-if="mediaType === 'image'"
            :value="item.caption || ''"
            @blur="updateCaption(index, $event.target.value)"
            placeholder="Caption..."
            class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 focus:outline-none placeholder-white/50">
        </div>
      </div>
    </div>
  `
};
