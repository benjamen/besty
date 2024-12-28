<template>
  <div v-if="sortedProducts?.length" class="space-y-4">
    <div class="mb-4 flex justify-end">
      <select v-model="sortOption" class="p-2 border border-gray-300 rounded-lg">
        <option value="name">Sort by Name</option>
        <option value="price">Sort by Price</option>
      </select>
    </div>
    
    <div
      v-for="(group, index) in sortedProducts"
      :key="index"
      class="p-4 bg-gray-100 rounded-lg shadow-sm"
    >
      <h3 class="font-bold text-lg mb-2">{{ group[0].productname }}</h3>
      <div class="space-y-4">
        <div
          v-for="product in group"
          :key="product.productname + product.source_site"
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm"
        >
          <div class="flex-1 mb-3 sm:mb-0">
            <strong class="text-lg block sm:inline">{{ product.productname }}</strong>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              <p class="text-sm text-gray-600">Price: ${{ product.current_price }}</p>
              <p class="text-sm text-gray-500">Source: {{ product.source_site }}</p>
              <p class="text-sm text-gray-500">Category: {{ product.category }}</p>
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
  <div v-else class="text-center text-gray-600 py-12">
    No products found. Try searching again.
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

// Props with validation
const props = defineProps({
  paginatedProducts: {
    type: Array,
    default: () => [],
    required: true
  }
});

// Sorting state
const sortOption = ref('name');

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

// Normalize product name for comparison
function normalizeProductName(name) {
  return name.toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Extremely strict similarity check
function isVeryClose(nameA, nameB) {
  const normalizedA = normalizeProductName(nameA);
  const normalizedB = normalizeProductName(nameB);
  
  // Exact match after normalization
  if (normalizedA === normalizedB) return true;
  
  // Check for minimal differences (just spacing or capitalization)
  const simpleA = normalizedA.replace(/[^a-z0-9]/g, '');
  const simpleB = normalizedB.replace(/[^a-z0-9]/g, '');
  
  return simpleA === simpleB;
}

// Group products with strict matching
const groupedProducts = computed(() => {
  if (!props.paginatedProducts?.length) return [];
  
  const groups = [];

  props.paginatedProducts.forEach((product) => {
    if (!product?.productname) return;
    
    let matchedGroup = null;

    // Find a matching group
    for (const group of groups) {
      if (group.length && isVeryClose(group[0].productname, product.productname)) {
        matchedGroup = group;
        break;
      }
    }

    // Add to existing group or create a new one
    if (matchedGroup) {
      matchedGroup.push({ ...product, quantity: product.quantity || 1 });
    } else {
      groups.push([{ ...product, quantity: product.quantity || 1 }]);
    }
  });

  return groups;
});

// Sort the grouped products
const sortedProducts = computed(() => {
  const sorted = [...groupedProducts.value];
  
  if (sortOption.value === 'name') {
    sorted.sort((a, b) => 
      normalizeProductName(a[0].productname).localeCompare(normalizeProductName(b[0].productname))
    );
  } else if (sortOption.value === 'price') {
    sorted.sort((a, b) => {
      const minPriceA = Math.min(...a.map(p => p.current_price));
      const minPriceB = Math.min(...b.map(p => p.current_price));
      return minPriceA - minPriceB;
    });
  }
  
  return sorted;
});
</script>