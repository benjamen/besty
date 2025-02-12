<template>
  <div class="space-y-8">
    <div v-if="paginatedProducts.length" class="space-y-6">
      <div 
        v-for="product in paginatedProducts" 
        :key="product.productname + product.source_site" 
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white rounded-xl border border-gray-200"
      >
        <img 
          :src="product.image_url" 
          alt="Product Image" 
          class="w-24 h-24 object-cover mr-4" 
        />
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
</template>

<script setup>
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

const handleAddToList = (product) => {
  emit("addToList", { ...product, quantity: product.quantity || 1 });
};
</script>

<style scoped>
/* Additional styles can go here */
</style>
