<template>
  <div>
    <div v-if="paginatedProducts.length > 0">
      <div v-for="product in paginatedProducts" :key="product.productname" class="product-item">
        <div>{{ product.productname }}</div>
        <div>{{ product.current_price }}</div>
        <div>{{ product.source_site }}</div>
        <!-- Add other product details as necessary -->
        <button @click="addToList(product)">Add to Cart</button>
      </div>
    </div>
    <div v-else>No products found</div>
    <div v-if="isLoading" class="loading">Loading...</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isLoading = ref(false);

// Assume `props` is passed as per Vue's props system
// props: { paginatedProducts: Array, addToList: Function }
</script>

<style scoped>
.product-item {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.loading {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}
</style>
