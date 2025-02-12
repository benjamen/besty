<template>
  <div class="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
    <input
      v-model="localSearchQuery"
      type="text"
      placeholder="Search for products..."
      class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
    />
    
    <button
      @click="handleSearch"
      class="w-full sm:w-auto py-3 px-6 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition duration-200"
    >
      Search
    </button>

    <button
      @click="clearSearch"
      class="w-full sm:w-auto py-3 px-6 bg-gray-300 text-black rounded-lg font-semibold text-lg hover:bg-gray-400 transition duration-200"
    >
      Clear Search
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// Define props and emits
const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'update:searchQuery',
  'search'
]);

const localSearchQuery = ref(props.searchQuery);

// Watch for changes in localSearchQuery and emit updates
watch(localSearchQuery, (newVal) => {
  emit('update:searchQuery', newVal);
});

// Emit search event with search query
const handleSearch = () => {
  const normalizedQuery = normalizeSearchQuery(localSearchQuery.value);

  // Assuming 'products' is available in your context, you might need to pass it down as a prop
  const filteredProducts = products.filter(product => {
    return (
      normalizedQuery.every(queryWord =>
        product.name.toLowerCase().includes(queryWord)
      )
    );
  });

  emit('search', filteredProducts);
};

// Clear search functionality
const clearSearch = () => {
  localSearchQuery.value = '';
  emit('update:searchQuery', '');
}

// Function to normalize the search query
const normalizeSearchQuery = (query) => {
  return query
    .toLowerCase() // Ensure case-insensitivity
    .trim() // Remove leading/trailing whitespace
    .split(/\s+/) // Split into individual words for multi-word searches
    .map(word => word.replace(/['']/g, '')) // Remove apostrophes
    .filter(word => word.length > 0); // Remove empty strings
};
</script>

<style scoped>
/* Add any additional styles for your component here */
</style>
