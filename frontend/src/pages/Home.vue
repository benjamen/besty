<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-4">Besty</h1>
  </div>
  <div class="min-h-screen bg-gray-50 py-4 sm:py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col space-y-4 sm:space-y-6">
      <div class="flex justify-end">
        <button
          @click="showShoppingList = !showShoppingList"
          class="py-2 px-4 bg-black text-white rounded-lg transition-colors duration-200 hover:bg-gray-800"
        >
          {{ showShoppingList ? 'Hide Shopping List' : 'Show Shopping List' }}
        </button>
      </div>

      <ShoppingList
        :show="showShoppingList"
        :items="selectedItems"
        @update:items="updateItems" 
        @remove-item="removeFromList"
        @export="exportToXLS"
        @saveCurrentList="saveCurrentList" 
      />

      <div class="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <SearchBar
          v-model:searchQuery="searchQuery"
          v-model:selectedCategory="selectedCategory"
          :categories="categories"
          @search="performSearch"
        />

        <ProductList
          :paginated-products="paginatedProducts"
          @add-to-list="addToList"
        />

        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :has-next-page="hasNextPage"
          :has-prev-page="hasPrevPage"
          @prev-page="prevPage"
          @next-page="nextPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineEmits,onMounted } from 'vue'
import { createListResource } from 'frappe-ui'
import * as XLSX from 'xlsx'
import fuzzysort from 'fuzzysort'
import SearchBar from '../components/SearchBar.vue'
import ProductList from '../components/ProductList.vue'
import Pagination from '../components/Pagination.vue'
import ShoppingList from '../components/ShoppingList.vue'

// State management
const searchQuery = ref('')
const selectedCategory = ref('')
const categories = ref([])
const selectedItems = ref([])
const allProducts = ref([])
const currentPage = ref(0)
const isLoading = ref(true)
const showShoppingList = ref(true)
const pageSize = 10
const emit = defineEmits();

// Product resource
const products = createListResource({
  doctype: 'Product Item',
  fields: ['productname', 'current_price', 'source_site', 'category', 'size', 'unit_price', 'unit_name'],
  orderBy: 'creation desc',
  start: 0,
  pageLength: 50000,
})

// Computed properties
const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return allProducts.value

  const results = fuzzysort.go(query, allProducts.value, {
    keys: ['productname', 'source_site'],
    threshold: -1000,
    all: true,
  })

  const matchedProducts = results.map((result) => result.obj)

  return matchedProducts.filter((product) =>
    selectedCategory.value ? product.category === selectedCategory.value : true
  )
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / pageSize))
const hasNextPage = computed(() => currentPage.value < totalPages.value - 1)
const hasPrevPage = computed(() => currentPage.value > 0)

const paginatedProducts = computed(() => {
  const start = currentPage.value * pageSize
  return filteredProducts.value.slice(start, start + pageSize)
})

// Methods
const extractCategories = () => {
  const uniqueCategories = new Set(allProducts.value.map((product) => product.category))
  categories.value = [...uniqueCategories]
}

const addToList = (product) => {
  console.log('Adding product:', product); // Log the product being added

  const existingItem = selectedItems.value.find(
    (item) => item.productname === product.productname && item.source_site === product.source_site
  );

  if (existingItem) {
    console.log('Item already exists, updating quantity:', existingItem); // Log existing item
    existingItem.quantity += product.quantity;
  } else {
    console.log('Item does not exist, adding new item:', product); // Log new item
    selectedItems.value.push({
      ...product,
      quantity: product.quantity
    });
  }

  // Emit an event to save the current list
  saveCurrentList();
}

const saveCurrentList = () => {
  console.log("Saving current list:", selectedItems.value);
  // Here you might want to call an API to save the list
  localStorage.setItem('shoppingList', JSON.stringify(selectedItems.value));
}

const updateItems = (newItems) => {
  selectedItems.value = newItems;
  console.log('Updated Selected Items:', selectedItems.value); // Log to verify
}

const removeFromList = (product) => {
  console.log('Removing item:', product); // Log for debugging
  selectedItems.value = selectedItems.value.filter(
    (item) => item.productname !== product.productname
  );
  console.log('Updated selected items:', selectedItems.value); // Log updated items
}

const getGroupSubtotal = (group) => {
  return group.reduce((total, item) => {
    return total + (item.current_price * item.quantity)
  }, 0)
}

const exportToXLS = () => {
  const exportData = []
  const groupedItems = selectedItems.value.reduce((groups, item) => {
    const source = item.source_site
    if (!groups[source]) {
      groups[source] = []
    }
    groups[source].push(item)
    return groups
  }, {})

  Object.entries(groupedItems).forEach(([source, group]) => {
    exportData.push({
      productname: `=== ${source} ===`,
      current_price: '',
      quantity: '',
      total: ''
    })

    group.forEach(item => {
      exportData.push({
        ...item,
        total: item.current_price * item.quantity
      })
    })

    exportData.push({
      productname: 'Subtotal',
      current_price: '',
      quantity: '',
      total: getGroupSubtotal(group)
    })

    exportData.push({
      productname: '',
      current_price: '',
      quantity: '',
      total: ''
    })
  })

  const totalPrice = selectedItems.value.reduce((total, item) => {
    return total + item.current_price * item.quantity
  }, 0).toFixed(2)

  exportData.push({
    productname: 'GRAND TOTAL',
    current_price: '',
    quantity: '',
    total: Number(totalPrice)
  })

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Shopping List')
  XLSX.writeFile(wb, 'shopping_list.xlsx')
}

const nextPage = () => {
  if (hasNextPage.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (hasPrevPage.value) {
    currentPage.value--
  }
}

const performSearch = () => {
  currentPage.value = 0
}

// Watch for data changes
watch(products, (newData) => {
  allProducts.value = (newData.data || []).map(product => ({
    ...product,
    quantity: 1
  }))
  extractCategories()
  isLoading.value = false
})

onMounted(async () => {
  await products.fetch()
});
// Initial data fetch

</script>