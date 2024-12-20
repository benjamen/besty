<template>
 <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-4">Welcome to Besty</h1>
    <router-link 
      to="/shopping-list" 
      class="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600"
    >
      Go to Shopping Lists
    </router-link>
  </div>
  <div class="min-h-screen bg-gray-50 py-4 sm:py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col space-y-4 sm:space-y-6">
      <!-- Toggle Shopping List -->
      <div class="flex justify-end">
        <button
          @click="showShoppingList = !showShoppingList"
          class="py-2 px-4 bg-black text-white rounded-lg transition-colors duration-200 hover:bg-gray-800"
        >
          {{ showShoppingList ? 'Hide Shopping List' : 'Show Shopping List' }}
        </button>
      </div>

      <!-- Shopping List Section -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div v-show="showShoppingList && selectedItems.length" class="bg-white p-4 rounded-lg shadow-md">
          <h3 class="text-xl font-bold text-gray-900">Shopping List</h3>
          
          <!-- Grouped Items -->
          <div v-if="groupedItems" class="space-y-6 mt-4">
            <div 
              v-for="(group, source) in groupedItems" 
              :key="source" 
              class="border-b border-gray-200 pb-4 last:border-0"
            >
              <!-- Source Site Header -->
              <div class="flex justify-between items-center mb-3 bg-gray-100 p-3 rounded-lg">
                <h4 class="text-lg font-semibold text-gray-800">{{ source }}</h4>
                <span class="text-lg font-bold text-gray-700">
                  Subtotal: ${{ getGroupSubtotal(group).toFixed(2) }}
                </span>
              </div>
              
              <!-- Items in Group -->
              <div class="space-y-2">
                <div
                  v-for="item in group"
                  :key="item.productname"
                  class="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"
                >
                  <div class="flex-1 mb-2 sm:mb-0">
                    <strong class="text-lg block sm:inline">{{ item.productname }}</strong>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      <p class="text-sm text-gray-600">Price: ${{ item.current_price }}</p>
                      <p class="text-sm text-gray-600">Quantity: {{ item.quantity }}</p>
                      <p class="text-sm text-gray-600">Total: ${{ (item.current_price * item.quantity).toFixed(2) }}</p>
                      <p class="text-sm text-gray-500">Category: {{ item.category }}</p>
                      <p class="text-sm text-gray-500">Size: {{ item.size }}</p>
                      <p class="text-sm text-gray-500">Unit: {{ item.unit_name }}</p>
                    </div>
                  </div>
                  <button
                    @click="removeFromList(item)"
                    class="w-full sm:w-auto py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Price -->
          <div class="mt-6 pt-4 border-t border-gray-200">
            <div class="text-xl font-bold text-right">
              Grand Total: ${{ totalPrice }}
            </div>
          </div>

          <!-- Export Button -->
          <div class="mt-4 text-right">
            <button 
              @click="exportToXLS"
              class="py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              Export to XLS
            </button>
          </div>
        </div>
      </Transition>

      <!-- Search Section -->
      <div class="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div class="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search for products..."
            class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            v-model="selectedCategory"
            class="w-full sm:w-auto p-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>

          <button
            @click="performSearch"
            class="w-full sm:w-auto py-2 px-6 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Search
          </button>
        </div>

        <div v-if="paginatedProducts.length" class="space-y-4">
          <div
            v-for="product in paginatedProducts"
            :key="product.productname"
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
                value="1"
              />
              <button
                @click="addToList(product)"
                class="flex-1 sm:flex-none py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                Add to List
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center text-gray-600 py-12">
          No products found. Try searching again.
        </div>

        <div class="flex flex-col sm:flex-row justify-between items-center py-4 space-y-2 sm:space-y-0">
          <button
            v-if="hasPrevPage"
            @click="prevPage"
            class="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Previous Page
          </button>
          <div class="flex items-center justify-center gap-4">
            <span>Page {{ currentPage + 1 }} of {{ totalPages }}</span>
          </div>
          <button
            v-if="hasNextPage"
            @click="nextPage"
            class="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Next Page
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, watch, computed } from 'vue'
import { createListResource } from 'frappe-ui'
import * as XLSX from 'xlsx'
import fuzzysort from 'fuzzysort'

const searchQuery = ref('')
const selectedCategory = ref('')
const categories = ref([])
const selectedItems = ref([])
const allProducts = ref([])
const currentPage = ref(0)
const isLoading = ref(true)
const showShoppingList = ref(true)
const pageSize = 10

// Product resource configuration
const products = createListResource({
  doctype: 'Product Item',
  fields: ['productname', 'current_price', 'source_site', 'category', 'size', 'unit_price', 'unit_name'],
  orderBy: 'creation desc',
  start: 0,
  pageLength: 50000,
})

// Computed properties
const groupedItems = computed(() => {
  return selectedItems.value.reduce((groups, item) => {
    const source = item.source_site
    if (!groups[source]) {
      groups[source] = []
    }
    groups[source].push(item)
    return groups
  }, {})
})

// Fuzzy Search
const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return allProducts.value

  // Perform fuzzy search
  const results = fuzzysort.go(query, allProducts.value, {
    keys: ['productname', 'source_site'],
    threshold: -1000, // Adjust to control strictness of fuzzy matching
    all: true,
  })

  // Extract matched products
  const matchedProducts = results.map((result) => result.obj)

  // Filter by category if selected
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

const totalPrice = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + item.current_price * item.quantity
  }, 0).toFixed(2)
})

// Methods
const getGroupSubtotal = (group) => {
  return group.reduce((total, item) => {
    return total + (item.current_price * item.quantity)
  }, 0)
}

const extractCategories = () => {
  const uniqueCategories = new Set(allProducts.value.map((product) => product.category))
  categories.value = [...uniqueCategories]
}

const addToList = (product) => {
  const existingItem = selectedItems.value.find(
    (item) => item.productname === product.productname
  )

  if (existingItem) {
    existingItem.quantity += product.quantity
  } else {
    selectedItems.value.push({
      ...product,
      quantity: product.quantity
    })
  }
}

const removeFromList = (product) => {
  selectedItems.value = selectedItems.value.filter(
    (item) => item.productname !== product.productname
  )
}

const exportToXLS = () => {
  const exportData = []

  Object.entries(groupedItems.value).forEach(([source, group]) => {
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

  exportData.push({
    productname: 'GRAND TOTAL',
    current_price: '',
    quantity: '',
    total: Number(totalPrice.value)
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

// Initial data fetch
products.fetch()
</script>
