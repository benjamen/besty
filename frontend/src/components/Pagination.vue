// components/Pagination.vue
<template>
  <div class="flex flex-col sm:flex-row justify-between items-center py-4 space-y-2 sm:space-y-0">
    <button
      v-if="hasPrevPage"
      @click="$emit('prevPage')"
      class="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
    >
      Previous Page
    </button>
    <div class="flex items-center justify-center gap-4">
      <span>Page {{ currentPage + 1 }} of {{ totalPages }}</span>
    </div>
    <button
      v-if="hasNextPage"
      @click="$emit('nextPage')"
      class="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
    >
      Next Page
    </button>
  </div>
</template>

<script setup>
defineProps(['currentPage', 'totalPages', 'hasNextPage', 'hasPrevPage'])
defineEmits(['prevPage', 'nextPage'])
</script>
