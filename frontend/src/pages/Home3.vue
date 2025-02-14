<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Title Section -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Besty</h1>
      <div class="mt-4 flex justify-between">
        <button @click="exportToXLS()" class="py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200">
          Export List
        </button>
      </div>
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
              class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border transition-colors duration-200"
              :class="{
                'bg-blue-50 border-blue-200': product.isClosestMatch,
                'bg-green-50 border-green-200': product.isCheapest,
                'border-gray-100 hover:bg-gray-50': !product.isClosestMatch && !product.isCheapest
              }"
            >
              <!-- Image Section -->
              <div class="md:col-span-3 flex justify-center md:justify-start">
                <img 
                  :src="product.image_url" 
                  :alt="product.productname" 
                  class="w-20 h-20 md:w-24 md:h-24 object-cover rounded"
                />
              </div>

              <!-- Product Details Section -->
              <div class="md:col-span-7">
                <h3 class="font-medium text-lg flex flex-wrap items-center gap-2">
                  {{ product.productname }}
                  <span 
                    v-if="product.isClosestMatch" 
                    class="text-blue-600 text-sm font-normal px-2 py-1 bg-blue-50 rounded"
                  >
                    Best match
                  </span>
                  <span 
                    v-if="product.isCheapest" 
                    class="text-green-600 text-sm font-normal px-2 py-1 bg-green-50 rounded"
                  >
                    Best price
                  </span>
                </h3>
                
                <div class="mt-2 space-y-1 text-sm text-gray-600">
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div class="flex items-center gap-1">
                      <span class="font-medium">Price:</span>
                      <span>${{ product.current_price }}</span>
                    </div>
                    <div class="hidden md:block text-gray-300">|</div>
                    <div class="flex items-center gap-1">
                      <span class="font-medium">Unit:</span>
                      <span>${{ product.unit_price }}/{{ product.unit_name }}</span>
                    </div>
                  </div>
                  
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div class="flex items-center gap-1">
                      <span class="font-medium">Size:</span>
                      <span>{{ product.size }}</span>
                    </div>
                    <div class="hidden md:block text-gray-300">|</div>
                    <div class="flex items-center gap-1">
                      <span class="font-medium">Shop:</span>
                      <span>{{ product.source_site }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Button Section -->
              <div class="md:col-span-2 flex items-center justify-center md:justify-end">
                <button
                  @click="quickAddToList(product)"
                  class="w-full md:w-auto py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm"
                >
                  Add to List
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Shopping List -->
        <div :class="{ 'pointer-events-none opacity-50': showQuickSearch }">
          <ShoppingList
            :show="showShoppingList"
            :items="selectedItems"
            @update:items="updateItems"
            @remove-item="removeFromList"
            @export="exportToXLS"
            @saveCurrentList="saveCurrentList"
          />
        </div>
        <div class="mb-4"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { createListResource } from 'frappe-ui';
import * as XLSX from 'xlsx';
import fuzzysort from 'fuzzysort';
import SearchBar from '../components/SearchBar2.vue';
import ProductList from '../components/ProductList2.vue';
import Pagination from '../components/Pagination.vue';
import ShoppingList from '../components/ShoppingList2.vue';

// State management
const searchQuery = ref('');
const quickSearchQuery = ref('');
const showQuickSearch = ref(false);
const selectedItems = ref([]);
const allProducts = ref([]);
const currentPage = ref(0);
const isLoading = ref(true);
const showShoppingList = ref(true);
const pageSize = 10;

// Product resource
const products = createListResource({
  doctype: 'Product Item',
  fields: [
    'name',
    'productname',
    'category',
    'source_site',
    'size',
    'image_url',
    'unit_price',
    'unit_name',
    'original_unit_quantity',
    'current_price',
    'price_history',
    'last_updated',
  ],
  orderBy: 'last_updated desc',
  start: 0,
  pageLength: 50000,
});

// Quick search results with scoring
const quickSearchResults = computed(() => {
  const query = quickSearchQuery.value.trim().toLowerCase();
  if (!query) return [];
  
  const results = fuzzysort.go(query, allProducts.value, {
    keys: ['productname', 'source_site'],
    threshold: -1000,
    limit: 12,
    all: true,
  });

  return results.map(result => ({
    ...result.obj,
    score: result.score
  }));
});

// Sort and enhance results with match and price indicators
const sortedSearchResults = computed(() => {
  if (!quickSearchResults.value.length) return [];

  // Sort by fuzzy search score
  const results = [...quickSearchResults.value].sort((a, b) => {
    return b.score - a.score;
  });

  // Find the cheapest product based on unit price
  const cheapestProduct = results.reduce((min, current) => {
    return (current.unit_price < min.unit_price) ? current : min;
  }, results[0]);

  // Mark the closest match and cheapest product
  return results.map(product => ({
    ...product,
    isClosestMatch: product.score === results[0].score,
    isCheapest: product.unit_price === cheapestProduct.unit_price
  }));
});

// Main search computed properties
const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  let results = allProducts.value;

  if (query) {
    results = fuzzysort.go(query, results, {
      keys: ['productname', 'source_site'],
      threshold: -1000,
      all: true,
    }).map(result => result.obj);
  }

  return results;
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / pageSize));
const hasNextPage = computed(() => currentPage.value < totalPages.value - 1);
const hasPrevPage = computed(() => currentPage.value > 0);

const paginatedProducts = computed(() => {
  const start = currentPage.value * pageSize;
  return filteredProducts.value.slice(start, start + pageSize);
});

// Quick search methods
const closeQuickSearch = () => {
  showQuickSearch.value = false;
  quickSearchQuery.value = '';
};

const quickAddToList = (product) => {
  addToList({ ...product, quantity: 1 });
  closeQuickSearch();
};

// Other methods
const addToList = (product) => {
  const existingItem = selectedItems.value.find(
    (item) => item.name === product.name
  );

  if (existingItem) {
    existingItem.quantity += product.quantity;
  } else {
    selectedItems.value.push({ ...product, quantity: product.quantity });
  }

  saveCurrentList();
};

const removeFromList = (product) => {
  selectedItems.value = selectedItems.value.filter(
    (item) => item.name !== product.name
  );
  saveCurrentList();
};

const updateItems = (newItems) => {
  selectedItems.value = newItems;
  saveCurrentList();
};

const saveCurrentList = () => {
  localStorage.setItem('shoppingList', JSON.stringify(selectedItems.value));
};

const exportToXLS = () => {
  try {
    const exportData = [];
    const groupedItems = selectedItems.value.reduce((groups, item) => {
      const source = item.source_site;
      if (!groups[source]) groups[source] = [];
      groups[source].push(item);
      return groups;
    }, {});

    Object.entries(groupedItems).forEach(([source, group]) => {
      exportData.push({ productname: `=== ${source} ===`, current_price: '', quantity: '', total: '' });

      group.forEach(item => {
        exportData.push({
          name: item.name,
          productname: item.productname,
          current_price: item.current_price,
          quantity: item.quantity,
          total: item.current_price * item.quantity
        });
      });

      const groupSubtotal = group.reduce((total, item) => 
        total + (item.current_price * item.quantity), 0);
      exportData.push({ productname: 'Subtotal', current_price: '', quantity: '', total: groupSubtotal });
      exportData.push({ productname: '', current_price: '', quantity: '', total: '' });
    });

    const totalPrice = selectedItems.value.reduce((total, item) => 
      total + item.current_price * item.quantity, 0);
    exportData.push({ productname: 'GRAND TOTAL', current_price: '', quantity: '', total: totalPrice });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shopping List');
    XLSX.writeFile(wb, 'shopping_list.xlsx');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
  }
};

const nextPage = () => {
  if (hasNextPage.value) currentPage.value++;
};

const prevPage = () => {
  if (hasPrevPage.value) currentPage.value--;
};

const performSearch = () => {
  currentPage.value = 0;
};

// Watch for data changes
watch(products, (newData) => {
  allProducts.value = (newData?.data || []).map((product) => ({
    ...product, 
    quantity: 1, 
  }));
  isLoading.value = false;
});

watch(selectedItems, (newItems) => {
  saveCurrentList();
}, { deep: true });

// Click outside to close quick search
const handleClickOutside = (event) => {
  const searchInput = document.querySelector('input[type="text"]');
  if (showQuickSearch.value && !event.target.closest('.quick-search-container') && event.target !== searchInput) {
    closeQuickSearch();
  }
};

onMounted(async () => {
  try {
    document.addEventListener('click', handleClickOutside);
    
    const savedList = localStorage.getItem('shoppingList');
    if (savedList) {
      const parsedList = JSON.parse(savedList);
      for (const item of parsedList) {
        const fullProduct = allProducts.value.find(product => product.name === item.name);
        if (fullProduct) {
          item.productname = fullProduct.productname;
        }
      }
      selectedItems.value = parsedList;
    }

    await products.fetch();
  } catch (error) {
    console.error('Error fetching products:', error);
    isLoading.value = false;
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
