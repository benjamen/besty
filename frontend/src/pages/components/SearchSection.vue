<template>
  <div>
    <!-- Search and Category Filter Components -->
    <div class="mb-6 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search for products..."
        class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        v-model="selectedCategory"
        class="p-2 border border-gray-300 rounded-lg"
      >
        <option value="">All Categories</option>
        <option v-for="category in uniqueCategories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
      <button
        @click="performSearch"
        class="py-2 px-4 bg-black text-white rounded-lg font-semibold"
      >
        Search
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';

// Define emit using defineEmits
const emit = defineEmits();

const performSearch = () => {
  emit('search'); // Emitting 'search' event
};

const searchQuery = ref('');
const selectedCategory = ref('');
const categories = ref([]);

// Compute unique categories using a Set and return as an array
const uniqueCategories = computed(() => Array.from(new Set(categories.value.map(category => category.name))));

</script>

<style scoped>
/* Scoped CSS */
</style>
