<template>
  <div class="space-y-8">
    <div v-if="sortedGroupedProducts.length" class="space-y-8">
      <div
        v-for="(group, index) in sortedGroupedProducts"
        :key="index"
        class="rounded-xl overflow-hidden border border-gray-200"
      >
        <!-- Category Header -->
        <div 
          :class="[
            'p-6 bg-opacity-20',
            {
              'bg-blue-100': index % 5 === 0,
              'bg-green-100': index % 5 === 1,
              'bg-purple-100': index % 5 === 2,
              'bg-orange-100': index % 5 === 3,
              'bg-teal-100': index % 5 === 4,
            }
          ]"
        >
          <h3 class="text-2xl font-bold text-gray-800">{{ formatCategoryName(group.category) }}</h3>
        </div>

        <!-- Products Section -->
        <div class="bg-white p-6 space-y-6">
          <div v-for="(product, productIndex) in group.products" :key="product.productname + product.source_site" class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
            <img :src="product.image_url" alt="Product Image" class="w-24 h-24 object-cover mr-4" />
            <div class="flex-1 mb-3 sm:mb-0">
              <strong class="text-lg block sm:inline">{{ product.productname }}</strong>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                <p class="text-sm text-gray-600">Price: ${{ product.current_price }}</p>
                <p class="text-sm text-gray-500">Source: {{ product.source_site }}</p>
                <p class="text-sm text-gray-500">Category: {{ formatCategoryName(product.category) }}</p>
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
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  paginatedProducts: {
    type: Array,
    default: () => [],
    required: true
  }
});

const emit = defineEmits(["addToList"]);

const formatCategoryName = (category) => {
  return category ? category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : '';
};

const sortedGroupedProducts = computed(() => {
  const groups = {};
  props.paginatedProducts.forEach(product => {
    if (!product.category) return;
    if (!groups[product.category]) {
      groups[product.category] = {
        category: product.category,
        products: []
      };
    }
    groups[product.category].products.push({ ...product, quantity: product.quantity || 1 });
  });
  return Object.values(groups).sort((a, b) => a.category.localeCompare(b.category));
});

const handleAddToList = (product) => {
  emit("addToList", { ...product, quantity: product.quantity || 1 });
};
</script>

<style scoped>
/* Additional styles can go here */
</style>
