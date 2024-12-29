<template>
  <div class="space-y-4">
    <!-- Display grouped products by category -->
    <div v-if="sortedGroupedProducts.length" class="space-y-4">
      <div
        v-for="(group, index) in sortedGroupedProducts"
        :key="index"
        class="p-4 bg-gray-100 rounded-lg shadow-sm"
      >
        <h3 class="font-bold text-lg mb-2">{{ formatCategoryName(group.category) }}</h3>
        <div class="space-y-4">
          <!-- Display subgroups for matched products -->
          <div v-for="(subGroup, subIndex) in group.subGroups" :key="subIndex" class="space-y-2">
            <h4 class="font-semibold text-md mb-1">{{ subGroup.label }}</h4>
            <div
              v-for="product in subGroup.products"
              :key="product.productname + product.source_site"
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm"
            >
              <div class="flex-1 mb-3 sm:mb-0">
                <strong class="text-lg block sm:inline">{{ product.productname }}</strong>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  <p class="text-sm text-gray-600">Price: ${{ product.current_price }}</p>
                  <p class="text-sm text-gray-500">Source: {{ product.source_site }}</p>
                  <p class="text-sm text-gray-500">Category: {{ formatCategoryName(product.category) }}</p>
                  <p v-if="product.size" class="text-sm text-gray-500">Size: {{ product.size }}</p>
                  <p v-if="product.unit_price" class="text-sm text-gray-500">Unit Price: ${{ product.unit_price }}</p>
                  <p v-if="product.unit_name" class="text-sm text-gray-500">Unit: {{ product.unit_name }}</p>
                </div>
              </div>
              <div class="flex w-full sm:w-auto gap-2">
                <input
                  v-model.number="product.quantity"
                  type="number"
                  placeholder="Qty"
                  class="w-20 p-2 border border-gray-300 rounded-lg"
                  min="1"
                />
                <button
                  @click="handleAddToList(product)"
                  class="flex-1 sm:flex-none py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  Add to List
                </button>
              </div>
            </div>
          </div>

          <!-- Display unmatched products directly under the category -->
          <div v-for="product in group.unmatchedProducts" :key="product.productname + product.source_site" class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
            <div class="flex-1 mb-3 sm:mb-0">
              <strong class="text-lg block sm:inline">{{ product.productname }}</strong>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                <p class="text-sm text-gray-600">Price: ${{ product.current_price }}</p>
                <p class="text-sm text-gray-500">Source: {{ product.source_site }}</p>
                <p class="text-sm text-gray-500">Category: {{ formatCategoryName(product.category) }}</p>
                <p v-if="product.size" class="text-sm text-gray-500">Size: {{ product.size }}</p>
                <p v-if="product.unit_price" class="text-sm text-gray-500">Unit Price: ${{ product.unit_price }}</p>
                <p v-if="product.unit_name" class="text-sm text-gray-500">Unit: {{ product.unit_name }}</p>
              </div>
            </div>
            <div class="flex w-full sm:w-auto gap-2">
              <input
                v-model.number="product.quantity"
                type="number"
                placeholder="Qty"
                class="w-20 p-2 border border-gray-300 rounded-lg"
                min="1"
              />
              <button
                @click="handleAddToList(product)"
                class="flex-1 sm:flex-none py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                Add to List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Display not categorized products -->
    <div v-if="notCategorizedProducts.length" class="space-y-4">
      <h3 class="font-bold text-lg mb-2">Not Categorized Products</h3>
      <div v-for="product in notCategorizedProducts" :key="product.productname + product.source_site" class="p-4 bg-gray-50 rounded-lg shadow-sm">
        <strong class="text-lg block">{{ product.productname }}</strong>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          <p class="text-sm text-gray-600">Price: ${{ product.current_price }}</p>
          <p class="text-sm text-gray-500">Source: {{ product.source_site }}</p>
          <p class="text-sm text-gray-500">Category: {{ formatCategoryName(product.category) }}</p>
          <p v-if="product.size" class="text-sm text-gray-500">Size: {{ product.size }}</p>
          <p v-if="product.unit_price" class="text-sm text-gray-500">Unit Price: ${{ product.unit_price }}</p>
          <p v-if="product.unit_name" class="text-sm text-gray-500">Unit: {{ product.unit_name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Props with validation
const props = defineProps({
  paginatedProducts: {
    type: Array,
    default: () => [],
    required: true
  },
  sortOption: {
    type: String,
    default: 'category'
  }
});

// Emits with validation
const emit = defineEmits({
  addToList: (payload) => {
    return payload && typeof payload === 'object' && 'productname' in payload;
  }
});

// Handle add to list with quantity validation
const handleAddToList = (product) => {
  const quantity = product.quantity || 1;
  emit('addToList', { ...product, quantity });
};

// Group products by category and create subgroups for similar products
const sortedGroupedProducts = computed(() => {
  const groups = {};

  // Group products by category
  props.paginatedProducts.forEach((product) => {
    if (!product?.productname || !product.category) return; // Ensure category exists

    // Initialize category group if it doesn't exist
    if (!groups[product.category]) {
      groups[product.category] = { category: product.category, subGroups: [], unmatchedProducts: [] };
    }

    // Check for existing subgroups based on similarity and size
    const similarGroup = groups[product.category].subGroups.find(subGroup => {
      return subGroup.products.some(p => stringSimilarity(p.productname, product.productname) && p.size === product.size);
    });

    if (similarGroup) {
      similarGroup.products.push({ ...product, quantity: product.quantity || 1 });
    } else {
      // If no similar group exists, check if it's unmatched
      const isUnmatched = groups[product.category].subGroups.every(subGroup => {
        return !subGroup.products.some(p => p.productname === product.productname && p.size === product.size);
      });

      if (isUnmatched) {
        groups[product.category].unmatchedProducts.push({ ...product, quantity: product.quantity || 1 });
      } else {
        // Create a new subgroup if no similar group exists
        groups[product.category].subGroups.push({
          label: product.productname, // Use the product name as the label
          products: [{ ...product, quantity: product.quantity || 1 }]
        });
      }
    }
  });

  // Convert the object to an array of groups
  return Object.values(groups);
});

// Function to calculate string similarity (basic implementation)
const stringSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const matchCount = [...shorter].filter(char => longer.includes(char)).length;
  return matchCount / longer.length >= 0.9; // 90% match
};

// Display not categorized products
const notCategorizedProducts = computed(() => {
  return props.paginatedProducts.filter(product => {
    return !sortedGroupedProducts.value.some(group => group.subGroups.flat().includes(product)) && !product.category;
  });
});

// Helper function to format category names
const formatCategoryName = (category) => {
  if (!category) return '';
  return category
    .replace(/-/g, ' ') // Replace dashes with spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
};
</script>