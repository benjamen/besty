<!-- Home.vue-->
<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Title Section -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Besty</h1>
      <button
        @click="showShoppingList = !showShoppingList"
        class="py-2 px-4 bg-black text-white rounded-lg transition-colors duration-200 hover:bg-gray-800"
      >
        {{ showShoppingList ? 'Hide Shopping List' : 'Show Shopping List' }}
      </button>
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
              v-for="product in quickSearchResults" 
              :key="product.name"
              class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100"
            >
              <div class="flex items-center space-x-4">
                <img :src="product.image_url" alt="Product Image" class="w-16 h-16 object-cover rounded" />
                <div>
                  <h3 class="font-medium">{{ product.productname }}</h3>
                  <p class="text-sm text-gray-600">${{ product.current_price }}</p>
                </div>
              </div>
              <button
                @click="quickAddToList(product)"
                class="py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                Add to List
              </button>
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
      </div>

      <div class="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <!-- Main Search Bar -->
        <div class="flex flex-col sm:flex-row justify-between items-center mb-4">
          <SearchBar
            v-model:searchQuery="searchQuery"
            @search="performSearch"
            class="flex-1"
          />
        </div>

        <!-- Product List -->
        <ProductList
          :paginatedProducts="paginatedProducts"
          @addToList="addToList"
        />

        <!-- Pagination -->
        <Pagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          :hasNextPage="hasNextPage"
          :hasPrevPage="hasPrevPage"
          @prevPage="prevPage"
          @nextPage="nextPage"
        />
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

// Quick search results
const quickSearchResults = computed(() => {
  const query = quickSearchQuery.value.trim().toLowerCase();
  if (!query) return [];
  
  return fuzzysort.go(query, allProducts.value, {
    keys: ['productname', 'source_site'],
    threshold: -1000,
    limit: 5, // Limit to top 5 results
    all: true,
  }).map(result => result.obj);
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
