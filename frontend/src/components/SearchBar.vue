// components/SearchBar.vue
<template>
  <div class="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
    <input
      v-model="localSearchQuery"
      type="text"
      placeholder="Search for products..."
      class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <select
      v-model="localSelectedCategory"
      class="w-full sm:w-auto p-2 border border-gray-300 rounded-lg"
    >
      <option value="">All Categories</option>
      <option v-for="category in categories" :key="category" :value="category">
        {{ category }}
      </option>
    </select>

    <button
      @click="$emit('search')"
      class="w-full sm:w-auto py-2 px-6 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors duration-200"
    >
      Search
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps(['searchQuery', 'selectedCategory', 'categories'])
const emit = defineEmits(['update:searchQuery', 'update:selectedCategory', 'search'])

const localSearchQuery = ref(props.searchQuery)
const localSelectedCategory = ref(props.selectedCategory)

watch(localSearchQuery, (newVal) => {
  emit('update:searchQuery', newVal)
})

watch(localSelectedCategory, (newVal) => {
  emit('update:selectedCategory', newVal)
})
</script>