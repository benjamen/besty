
// components/ProductList.vue
<template>
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
  @click="$emit('addToList', { ...product, quantity: product.quantity })"
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
</template>

<script setup>
defineProps(['paginatedProducts'])
defineEmits(['addToList'])
</script>
