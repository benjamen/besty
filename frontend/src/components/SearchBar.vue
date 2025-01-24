<template>
  <div class="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
    <input
      v-model="localSearchQuery"
      type="text"
      placeholder="Search for products..."
      class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
    />
    
    <select
      v-model="localSelectedCategory"
      class="w-full sm:w-auto p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
    >
      <option value="">All Categories</option>
      <option v-for="category in sortedFormattedCategories" :key="category.value" :value="category.value">
        {{ category.label }}
      </option>
    </select>

    <div class="flex items-center">
      <label for="sort" class="mr-2 text-sm">Sort By:</label>
      <select v-model="localSortOption" id="sort" class="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">
        <option value="name">Name</option>
        <option value="price">Price</option>
        <option value="category">Category</option>
      </select>
    </div>

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
import { ref, watch, computed } from 'vue';

// Define props and emits
const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  selectedCategory: {
    type: String,
    default: ''
  },
  categories: {
    type: Array,
    default: () => []
  },
  sortOption: {
    type: String,
    default: 'category'
  }
});

const emit = defineEmits([
  'update:searchQuery',
  'update:selectedCategory',
  'search',
  'update:sortOption'
]);

const localSearchQuery = ref(props.searchQuery);
const localSelectedCategory = ref(props.selectedCategory);
const localSortOption = ref(props.sortOption);

// Watch for changes in localSortOption and emit updates
watch(localSortOption, (newVal) => {
  emit('update:sortOption', newVal);
});

// Watch for changes in localSearchQuery and emit updates
watch(localSearchQuery, (newVal) => {
  emit('update:searchQuery', newVal);
});

// Watch for changes in localSelectedCategory and emit updates
watch(localSelectedCategory, (newVal) => {
  emit('update:selectedCategory', newVal);
});

// Emit search event with search query and selected category
const handleSearch = () => {
  const normalizedQuery = normalizeSearchQuery(localSearchQuery.value);

  // Assuming 'products' is available in your context, you might need to pass it down as a prop
  const filteredProducts = products.filter(product => {
    return (
      normalizedQuery.every(queryWord =>
        product.name.toLowerCase().includes(queryWord) ||
        product.category.toLowerCase().includes(queryWord)
      )
    );
  });

  emit('search', filteredProducts);
};

// Clear search functionality
const clearSearch = () => {
  localSearchQuery.value = '';
  localSelectedCategory.value = '';
  emit('update:searchQuery', '');
  emit('update:selectedCategory', '');
}

// Computed property to format and sort categories for display
const sortedFormattedCategories = computed(() => {
  if (!Array.isArray(props.categories)) return []; // Check if categories is an array
  
  // Format and sort categories
  return props.categories
    .map(category => ({
      value: category,
      label: formatCategoryName(category)
    }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort by label
});

// Function to format category names for display
const formatCategoryName = (category) => {
  if (!category) return '';
  return category
    .replace(/-/g, ' ') // Replace dashes with spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
};

// Function to normalize the search query
const normalizeSearchQuery = (query) => {
  return query
    .toLowerCase() // Ensure case-insensitivity
    .trim() // Remove leading/trailing whitespace
    .split(/\s+/) // Split into individual words for multi-word searches
    .map(word => word.replace(/['’]/g, '')) // Remove apostrophes
    .filter(word => word.length > 0); // Remove empty strings
};
</script>

<style scoped>
/* Add any additional styles for your component here */
</style>