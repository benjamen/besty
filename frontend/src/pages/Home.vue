<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-6 flex">
      <!-- Search Section -->
      <div class="flex-1">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <!-- Search and Category Filter -->
          <div class="mb-6 flex space-x-4">
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="Search for products..."
              class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              v-model="selectedCategory"
              class="p-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>

            <!-- Search Button (Updated to be larger and black) -->
            <Button
              @click="performSearch"
              class="py-3 px-6 bg-black text-white rounded-lg font-semibold text-lg"
            >
              Search
            </Button>
          </div>

          <!-- Product List -->
          <div v-if="paginatedProducts.length" class="space-y-4">
            <div
              v-for="product in paginatedProducts"
              :key="product.productname"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm"
            >
              <div class="flex-1">
                <strong class="text-lg">{{ product.productname }}</strong>
                <p class="text-sm text-gray-600">Price: ${{ product.current_price }}</p>
                <p class="text-sm text-gray-500">Source: {{ product.source_site }}</p>
                <p class="text-sm text-gray-500">Category: {{ product.category }}</p> <!-- Display category -->
                <p class="text-sm text-gray-500">Size: {{ product.size }}</p> <!-- New field -->
                <p class="text-sm text-gray-500">Unit Price: ${{ product.unit_price }}</p> <!-- New field -->
                <p class="text-sm text-gray-500">Unit Name: {{ product.unit_name }}</p> <!-- New field -->
  
              </div>
              <div class="flex gap-2">
                <Input
                  v-model.number="product.quantity"
                  type="number"
                  placeholder="Qty"
                  class="w-16 p-2 border border-gray-300 rounded-lg"
                  min="1"
                  :value="product.quantity || 1"
                />
                <Button
                  variant="primary"
                  @click="addToList(product)"
                  class="py-2 px-4"
                >
                  Add to List
                </Button>
              </div>
            </div>
          </div>

          <!-- No Results Message -->
          <div v-else class="text-center text-gray-600 py-12">
            No products found. Try searching again.
          </div>

          <!-- Pagination -->
          <div class="flex justify-between py-4">
            <Button
              v-if="hasPrevPage"
              @click="prevPage"
              class="px-4 py-2 bg-black text-white rounded-lg"
            >
              Previous Page
            </Button>
            <div class="flex items-center justify-center gap-4">
              <span>Page {{ currentPage + 1 }} of {{ totalPages }}</span>
            </div>

            <!-- Next Page Button (Fixed) -->
            <Button
              v-if="hasNextPage"
              @click="nextPage"
              class="px-4 py-2 bg-black text-white rounded-lg"
            >
              Next Page
            </Button>
          </div>
        </div>
      </div>

      <!-- Shopping List Section -->
      <div v-if="selectedItems.length" class="w-1/3 ml-6 bg-white p-4 rounded-lg shadow-md">
        <h3 class="text-xl font-bold text-gray-900">Shopping List</h3>
        <div v-if="selectedItems.length > 0" class="space-y-2 mt-4">
          <div
            v-for="item in selectedItems"
            :key="item.productname"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"
          >
            <div class="flex-1">
              <strong class="text-lg">{{ item.productname }}</strong>
              <p class="text-sm text-gray-600">Price: ${{ item.current_price }}</p>
              <p class="text-sm text-gray-600">Quantity: {{ item.quantity }}</p>
              <p class="text-sm text-gray-500">Source: {{ item.source_site }}</p> <!-- Display source_site -->
              <p class="text-sm text-gray-500">Category: {{ item.category }}</p> <!-- Display category in shopping list -->
              <p class="text-sm text-gray-500">Size: {{ item.size }}</p> <!-- New field -->
              <p class="text-sm text-gray-500">Unit Price: ${{ item.unit_price }}</p> <!-- New field -->
              <p class="text-sm text-gray-500">Unit Name: {{ item.unit_name }}</p>
            </div>
            <div class="flex gap-2">
              <Button
                variant="danger"
                @click="removeFromList(item)"
                class="py-2 px-4 bg-red-500 text-white rounded-lg"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>

        <!-- Total Price -->
        <div class="mt-4 text-lg font-bold text-right">
          Total: ${{ totalPrice }}
        </div>

        <!-- Export Button -->
        <div class="mt-4 text-right">
          <Button @click="exportToXLS">Export to XLS</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { createListResource } from 'frappe-ui'
import { ref, watch, computed } from 'vue'
import * as XLSX from 'xlsx'

const searchQuery = ref('') // Search query input
const selectedCategory = ref('') // Category filter
const categories = ref([]) // Store available categories
const selectedItems = ref([]) // List of products added to the shopping list
const allProducts = ref([]) // Store all products fetched from the server
const currentPage = ref(0) // Current page for pagination
const isLoading = ref(true) // Loading state to display until products are fetched

// Product resource configuration
const products = createListResource({
  doctype: 'Product Item',
  fields: ['productname', 'current_price', 'source_site', 'category', 'size', 'unit_price', 'unit_name'], // Include new fields
  orderBy: 'creation desc',
  start: 0,
  pageLength: 50000,
});

// Fetch initial data
products.fetch()

// Store all products once fetched
watch(products, (newData) => {
  allProducts.value = newData.data || []
  extractCategories() // Extract categories from the fetched data
  isLoading.value = false // Set loading to false once data is fetched
  paginateProducts() // Call paginateProducts after fetching products
})

// Extract unique categories from the fetched products
const extractCategories = () => {
  const uniqueCategories = new Set(allProducts.value.map((product) => product.category))
  categories.value = [...uniqueCategories]
}

// Filtered products based on the search query and selected category
const filteredProducts = computed(() => {
  return allProducts.value.filter((product) =>
    (product.productname.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    product.source_site.toLowerCase().includes(searchQuery.value.toLowerCase())) &&
    (selectedCategory.value ? product.category === selectedCategory.value : true) // Filter by category if selected
  )
})

// Pagination variables
const pageSize = 10
const totalPages = computed(() => Math.ceil(filteredProducts.value.length / pageSize))
const hasNextPage = computed(() => currentPage.value < totalPages.value - 1)
const hasPrevPage = computed(() => currentPage.value > 0)

const paginatedProducts = computed(() => {
  const start = currentPage.value * pageSize
  return filteredProducts.value.slice(start, start + pageSize)
})

// Watch for search query changes and update pagination
watch(searchQuery, () => {
  currentPage.value = 0 // Reset to the first page on search query change
  paginateProducts() // Call paginateProducts when search query changes
})

// Watch for category changes and update pagination
watch(selectedCategory, () => {
  currentPage.value = 0 // Reset to the first page on category change
  paginateProducts() // Call paginateProducts when category changes
})

// Add product to the shopping list
const addToList = (product) => {
  const existingItem = selectedItems.value.find(
    (item) => item.productname === product.productname
  )

  if (existingItem) {
    existingItem.quantity += product.quantity || 1
  } else {
    selectedItems.value.push({
      ...product,
      quantity: product.quantity || 1,
    })
  }
  console.log('Added to list:', product.productname)
}

// Remove product from the shopping list
const removeFromList = (product) => {
  selectedItems.value = selectedItems.value.filter(
    (item) => item.productname !== product.productname
  )
  console.log('Removed from list:', product.productname)
}

// Compute total price for the shopping list
const totalPrice = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + item.current_price * item.quantity
  }, 0).toFixed(2) // Calculating total price
})

// Export shopping list to Excel
const exportToXLS = () => {
  const ws = XLSX.utils.json_to_sheet(selectedItems.value)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Shopping List')
  XLSX.writeFile(wb, 'shopping_list.xlsx')
}

// Pagination controls
const nextPage = () => {
  if (hasNextPage.value) {
    currentPage.value++
    paginateProducts() // Call paginateProducts when moving to the next page
  }
}

const prevPage = () => {
  if (hasPrevPage.value) {
    currentPage.value--
    paginateProducts() // Call paginateProducts when moving to the previous page
  }
}

// Perform search manually when clicking the Search button
const performSearch = () => {
  currentPage.value = 0 // Reset to the first page on search
  paginateProducts() // Call paginateProducts after search
}

// Pagination function
const paginateProducts = () => {
  const start = currentPage.value * pageSize
  const end = start + pageSize
  paginatedProducts.value = filteredProducts.value.slice(start, end)
}
</script>

<style scoped>
/* Custom Styling */
input:focus {
  border-color: #4CAF50;
}

button {
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #4CAF50;
}

button:active {
  background-color: #388E3C;
}

/* Custom styles for remove button */
button.bg-red-500 {
  background-color: #e53e3e;
}

button.bg-red-500:hover {
  background-color: #c53030;
}

/* Custom styles for pagination buttons */
button.bg-black {
  background-color: #000000;
}

button.bg-black:hover {
  background-color: #333333;
}
</style>
