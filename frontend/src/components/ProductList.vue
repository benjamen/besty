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
          <div v-if="group.singleProduct" class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-100 mb-6">
            <img :src="group.products[0].image_url" alt="Product Image" class="w-24 h-24 object-cover mr-4" />
            <div class="flex-1">
              <strong class="text-lg block">{{ group.products[0].productname }}</strong>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                <p class="text-sm text-gray-600">Price: ${{ group.products[0].current_price }}</p>
                <p class="text-sm text-gray-500">Source: {{ group.products[0].source_site }}</p>
                <p class="text-sm text-gray-500">Category: {{ formatCategoryName(group.products[0].category) }}</p>
                <p v-if="group.products[0].size" class="text-sm text-gray-500">Size: {{ group.products[0].size }}</p>
                <p v-if="group.products[0].unit_price" class="text-sm text-gray-500">Unit Price: ${{ group.products[0].unit_price }}</p>
                <p v-if="group.products[0].unit_name" class="text-sm text-gray-500">Unit: {{ group.products[0].unit_name }}</p>
              </div>
            </div>
          </div>

          <div v-else>
            <div v-for="(subGroup, subIndex) in group.subGroups" :key="subIndex" class="mb-8">
              <h4 class="font-semibold text-lg text-gray-700 mb-4">{{ subGroup.label }}</h4>
              <div v-for="(product, productIndex) in subGroup.products" :key="product.productname + product.source_site" class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
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
    </div>

    <div v-if="notCategorizedProducts.length" class="space-y-4">
      <h3 class="text-2xl font-bold text-gray-800 p-6">Not Categorized Products</h3>
      <div v-for="product in notCategorizedProducts" :key="product.productname + product.source_site" class="p-4 bg-gray-50 rounded-lg border border-gray-100">
        <strong class="text-lg block">{{ product.productname }}</strong>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          <p class="text-sm text-gray-600">Price: ${{ product.current_price }}</p>
          <p class="text-sm text-gray-500">Source: {{ product.source_site }}</p>
          <p class="text-sm text-gray-500">Category: {{ formatCategoryName(product.category) }}</p>
          <p v-if="product.size" class="text-sm text-gray-500">Size: {{ product.size }}</p>
          <p v-if="product.unit_price" class="text-sm text-gray-500">Unit Price: ${{ product.unit_price }}</p>
          <p v-if="product.unit_name" class="text-sm text-gray-500">Unit: {{ product.unit_name }}</p>
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
  },
  sortOption: {
    type: String,
    default: 'category'
  }
});

const emit = defineEmits({
  addToList: (payload) => {
    return payload && typeof payload === 'object' && 'productname' in payload;
  }
});

// Normalize text for comparison
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[^a-z0-9 ]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Function to capitalize the first letter of each word
const capitalizeWords = (text) => {
  return text.replace(/\b\w/g, char => char.toUpperCase());
};

// Function to format category names for display
const formatCategoryName = (category) => {
  if (!category) return '';
  return capitalizeWords(category.replace(/-/g, ' '));
};

// Calculate price difference between two products
const getPriceDifference = (product, baseProduct) => {
  return product.current_price - baseProduct.current_price;
};

// Format price difference for display
const formatPriceDifference = (difference) => {
  const prefix = difference > 0 ? '+' : '';
  return `${prefix}$${difference.toFixed(2)}`;
};

// Function to find the exact matched strings from product names
const getMatchedString = (products) => {
  if (!products.length) return '';

  // Normalize product names for comparison
  const normalizedNames = products.map(product => normalizeText(product.productname));

  // Find common parts in the product names
  const commonParts = normalizedNames.reduce((acc, name) => {
    const parts = name.split(" ");
    if (acc.length === 0) return parts; // Initialize with the first product's parts
    return acc.filter(part => parts.includes(part)); // Keep only common parts
  }, []);

  // Create the matched string from common parts
  const matchedString = commonParts.join(" ");
  
  // Return the matched string with count of matching items
  return `${matchedString} (${products.length} matching items)`;
};

// Function to check if two products are similar based on name and size
const areProductsSimilar = (product1, product2) => {
  // Check if sizes are the same
  const sizeMatch = product1.size === product2.size;

  // If sizes don't match, return false
  if (!sizeMatch) return false;

  // Normalize names for comparison
  const normalizedName1 = normalizeText(product1.productname);
  const normalizedName2 = normalizeText(product2.productname);

  // Check for common words in the names
  const keywords1 = normalizedName1.split(" ");
  const keywords2 = normalizedName2.split(" ");

  // Check if any keyword in the first product's name exists in the second product's name
  const commonKeywords = keywords1.filter(keyword => keywords2.includes(keyword));

  // Allow matching if there are common keywords
  return commonKeywords.length > 0;
};

const sortedGroupedProducts = computed(() => {
  const groups = {};

  // Group products by category
  props.paginatedProducts.forEach(product => {
    if (!product?.productname || !product.category) return;

    if (!groups[product.category]) {
      groups[product.category] = {
        category: product.category,
        products: [] // Change to a flat structure for single products
      };
    }

    // Add product directly to the category
    groups[product.category].products.push({ ...product, quantity: product.quantity || 1 });
  });

  // Transform groups into the desired structure
  const sortedGroups = Object.values(groups).map(group => {
    if (group.products.length === 1) {
      // If there's only one product, return it directly
      return {
        category: group.category,
        products: group.products,
        singleProduct: true // Flag to indicate single product
      };
    } else {
      // If there are multiple products, create subgroups
      const subGroups = [];
      group.products.forEach(product => {
        let foundGroup = subGroups.find(subGroup =>
          areProductsSimilar(subGroup.products[0], product)
        );

        if (foundGroup) {
          foundGroup.products.push(product);
        } else {
          // Create a new subgroup with the matched string as the label
          foundGroup = {
            label: getMatchedString([product]),
            products: [product]
          };
          subGroups.push(foundGroup);
        }
      });

      // Update the label of each subgroup to reflect the matched string
      subGroups.forEach(subGroup => {
        subGroup.label = getMatchedString(subGroup.products);
      });

      return {
        category: group.category,
        subGroups: subGroups
      };
    }
  });

  // Sort groups based on the selected sort option
  return sortedGroups.sort((a, b) => {
    return a.category.localeCompare(b.category);
  });
});

const notCategorizedProducts = computed(() => {
  return props.paginatedProducts.filter(product => !product.category);
});

const handleAddToList = (product) => {
  const quantity = product.quantity || 1;
  emit('addToList', { ...product, quantity });
};

</script>

<style scoped>
/* Add any additional styles for your component here */
</style>