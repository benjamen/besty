<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Title Section -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 class="text-3xl font-bold text-gray-800">Besty</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <p class="text-lg text-gray-600">Loading products...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      <!-- Shopping List Section with Search -->
      <div class="relative">
        <!-- Search Input Above Shopping List -->
        <div class="mb-4">
          <div class="flex gap-2">
            <input
              v-model="quickSearchQuery"
              type="text"
              placeholder="Quick search for products..."
              class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              @focus="showQuickSearch = true"
            />
            <button
              v-if="showQuickSearch"
              @click="closeQuickSearch"
              class="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>

        <!-- Quick Search Results Overlay -->
        <div 
          v-if="showQuickSearch && quickSearchResults.length > 0"
          class="absolute top-16 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-96 overflow-y-auto"
        >
          <div class="p-4 space-y-4">
            <div 
              v-for="product in sortedSearchResults" 
              :key="product.name"
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100 gap-4"
              :class="{
                'bg-blue-50 border-blue-200': product.isClosestMatch,
                'bg-green-50 border-green-200': product.isCheapest
              }"
            >
              <div class="flex items-start space-x-4">
                <img :src="product.image_url" alt="Product Image" class="w-16 h-16 object-cover rounded" />
                <div class="flex-grow min-w-0">
                  <h3 class="font-medium truncate">
                    {{ product.productname }}
                    <span v-if="product.isClosestMatch" class="ml-2 text-blue-600 text-sm font-normal">Best match</span>
                    <span v-if="product.isCheapest" class="ml-2 text-green-600 text-sm font-normal">Best price</span>
                  </h3>
                  <div class="text-sm text-gray-600 mt-1">
                    <p class="flex flex-wrap items-center gap-2">
                      <span class="font-medium">Price:</span> 
                      <span>${{ product.current_price }}</span>
                      <span class="text-gray-400 hidden sm:inline">|</span>
                      <span class="font-medium">Unit:</span>
                      <span>${{ product.unit_price }}/{{ product.unit_name }}</span>
                    </p>
                    <p class="flex flex-wrap items-center gap-2">
                      <span class="font-medium">Size:</span>
                      <span>{{ product.size }}</span>
                      <span class="text-gray-400 hidden sm:inline">|</span>
                      <span class="font-medium">Shop:</span>
                      <span>{{ product.source_site }}</span>
                    </p>
                  </div>
                </div>
              </div>
              <button
                @click="quickAddToList(product)"
                class="py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm whitespace-nowrap"
              >
                Add to List
              </button>
            </div>
          </div>
        </div>

        <!-- Shopping List -->
        <div :class="{ 'pointer-events-none opacity-50': showQuickSearch }">
          <!-- Display the Shopping List -->
          <ShoppingList
            :items="selectedItems"
            @update:items="updateItems"
            @remove-item="removeFromList"
            @export="exportToXLS"
            @saveCurrentList="saveCurrentList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Imports and State Management
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { createListResource } from 'frappe-ui';
import * as XLSX from 'xlsx';
import fuzzysort from 'fuzzysort';
import ShoppingList from '../components/ShoppingList2.vue';

const searchQuery = ref('');
const quickSearchQuery = ref('');
const showQuickSearch = ref(false);
const selectedItems = ref([]);
const allProducts = ref([]);
const isLoading = ref(true);

// Initialize Products Resource
const products = createListResource({
  doctype: 'Product Item',
  fields: [
    'name', 'productname', 'category', 'source_site', 'size', 'image_url',
    'unit_price', 'unit_name', 'current_price', 'last_updated'
  ],
  orderBy: 'last_updated desc',
  start: 0,
  pageLength: 50000
});

// Computed Properties
const quickSearchResults = computed(() => {
  const query = quickSearchQuery.value.trim().toLowerCase();
  if (!query) return [];
  const results = fuzzysort.go(query, allProducts.value, {
    keys: ['productname', 'source_site'],
    threshold: -1000,
    limit: 12
  });
  return results.map(result => ({ ...result.obj, score: result.score }));
});

const sortedSearchResults = computed(() => {
  if (!quickSearchResults.value.length) return [];
  const results = [...quickSearchResults.value].sort((a, b) => b.score - a.score);
  const cheapestProduct = results.reduce((min, current) => (
    current.unit_price < min.unit_price ? current : min
  ), results[0]);
  return results.map(product => ({
    ...product,
    isClosestMatch: product.score === results[0].score,
    isCheapest: product.unit_price === cheapestProduct.unit_price
  }));
});

// Methods
const closeQuickSearch = () => {
  showQuickSearch.value = false;
  quickSearchQuery.value = '';
};

const quickAddToList = (product) => {
  addToList({ ...product, quantity: 1 });
  closeQuickSearch();
};

const addToList = (product) => {
  const existingItem = selectedItems.value.find(item => item.name === product.name);
  if (existingItem) {
    existingItem.quantity += product.quantity;
  } else {
    selectedItems.value.push({ ...product, quantity: product.quantity });
  }
  saveCurrentList();
};

const removeFromList = (product) => {
  selectedItems.value = selectedItems.value.filter(item => item.name !== product.name);
  saveCurrentList();
};

const saveCurrentList = () => {
  localStorage.setItem('shoppingList', JSON.stringify(selectedItems.value));
};

// Watchers
watch(products, (newData) => {
  allProducts.value = (newData?.data || []).map(product => ({ ...product, quantity: 1 }));
  isLoading.value = false;
});

onMounted(async () => {
  await products.fetch();
  const savedList = localStorage.getItem('shoppingList');
  if (savedList) selectedItems.value = JSON.parse(savedList);
});
</script>
