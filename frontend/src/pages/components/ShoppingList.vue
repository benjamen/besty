<template>
  <div v-if="groupedShoppingLists.length" class="w-full bg-white p-4 rounded-lg shadow-md">
    <h3 class="text-xl font-bold text-gray-900">Shopping List</h3>
    <div v-for="source in groupedShoppingLists" :key="source.key">
      <h4 class="text-lg font-bold text-gray-800">{{ source.key }}</h4>
      <div v-if="source.items.length > 0" class="space-y-2 mt-4">
        <div
          v-for="item in source.items"
          :key="item.productname"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"
        >
          <div class="flex-1">
            <strong class="text-lg">{{ item.productname }}</strong>
            <p class="text-sm text-gray-600">Price: ${{ item.current_price }}</p>
            <p class="text-sm text-gray-600">Quantity: {{ item.quantity }}</p>
            <p class="text-sm text-gray-500">Source: {{ item.source_site }}</p>
            <p class="text-sm text-gray-500">Category: {{ item.category }}</p>
            <p class="text-sm text-gray-500">Size: {{ item.size }}</p>
            <p class="text-sm text-gray-500">Unit Price: ${{ item.unit_price }}</p>
            <p class="text-sm text-gray-500">Unit Name: {{ item.unit_name }}</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="removeFromList(item)"
              class="py-2 px-4 bg-red-500 text-white rounded-lg"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 text-lg font-bold text-right">
      Total: ${{ totalPrice }}
    </div>

    <div class="mt-4 text-right">
      <button @click="exportToXLS">Export to XLS</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const groupedShoppingLists = ref([])

const totalPrice = computed(() => {
  return groupedShoppingLists.value.reduce((total, source) => {
    return total + source.items.reduce((sum, item) => sum + item.current_price * item.quantity, 0)
  }, 0).toFixed(2)
})

const removeFromList = (item) => {
  groupedShoppingLists.value.forEach(source => {
    if (Array.isArray(source.items)) {
      source.items = source.items.filter(i => i.productname !== item.productname)
    }
  });
}

const exportToXLS = () => {
  // Placeholder for XLS export logic
  console.log('Exporting to XLS...')
}
</script>
