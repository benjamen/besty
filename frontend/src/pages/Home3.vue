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
        <!-- Quick Search Results Overlay -->
        <div 
          v-if="showQuickSearch && quickSearchResults.length > 0"
          class="absolute top-16 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-96 overflow-y-auto"
        >
          <div class="p-4 space-y-4">
            <div 
              v-for="product in sortedSearchResults" 
              :key="product.name"
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100"
              :class="{
                'bg-blue-50 border-blue-200': product.isClosestMatch,
                'bg-green-50 border-green-200': product.isCheapest
              }"
            >
              <div class="flex items-center space-x-4 flex-grow">
                <img :src="product.image_url" alt="Product Image" class="w-16 h-16 object-cover rounded" />
                <div class="flex-grow">
                  <h3 class="font-medium">
                    {{ product.productname }}
                    <span v-if="product.isClosestMatch" class="ml-2 text-blue-600 text-sm font-normal">Best match</span>
                    <span v-if="product.isCheapest" class="ml-2 text-green-600 text-sm font-normal">Best price</span>
                  </h3>
                  <div class="text-sm text-gray-600 mt-1">
                    <p class="flex items-center gap-2">
                      <span class="font-medium">Price:</span> 
                      <span>${{ product.current_price }}</span>
                      <span class="text-gray-400">|</span>
                      <span class="font-medium">Unit:</span>
                      <span>${{ product.unit_price }}/{{ product.unit_name }}</span>
                    </p>
                    <p class="flex items-center gap-2">
                      <span class="font-medium">Size:</span>
                      <span>{{ product.size }}</span>
                      <span class="text-gray-400">|</span>
                      <span class="font-medium">Shop:</span>
                      <span>{{ product.source_site }}</span>
                    </p>
                  </div>
                </div>
              </div>
              <button
                @click="quickAddToList(product)"
                class="mt-2 sm:mt-0 sm:ml-4 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
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
    </div>
  </div>
</template>
