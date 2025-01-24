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
    <img :src="group.products[0].image_url" alt="Product Image" class="w-24 h-24 object-cover mr-4" /> <!-- Added image -->
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
      <h4 class="font-semibold text-lg text-gray-700 mb-4">{{ subGroup.label }} ({{ subGroup.products.length }} matching items)</h4>
      <div v-for="(product, productIndex) in subGroup.products" :key="product.productname + product.source_site" class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
        <img :src="product.image_url" alt="Product Image" class="w-24 h-24 object-cover mr-4" /> <!-- Added image -->
        <div class="flex-1 mb-3 sm:mb-0">
          <strong class="text-lg block sm:inline">{{ product.productname }}</strong>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            <div class="flex items-center gap-2">
              <p class="text-sm text-gray-600">Price: ${{ product.current_price }}</p>
              <span
                v-if="subGroup.products.length > 1 && productIndex > 0 && getPriceDifference(product, subGroup.products[0]) !== 0"
                :class="{
                  'px-2 py-1 text-xs font-medium rounded-full': true,
                  'bg-red-100 text-red-800': getPriceDifference(product, subGroup.products[0]) > 0,
                  'bg-green-100 text-green-800': getPriceDifference(product, subGroup.products[0]) < 0
                }"
              >
                {{ formatPriceDifference(getPriceDifference(product, subGroup.products[0])) }}
              </span>
            </div>
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

// Function to find the most appropriate matched string from product names
const getMatchedString = (products) => {
  if (!products.length) return '';

  // Filter by category and size
  const category = products[0].category;
  const size = products[0].size;

  // Extract the product names that have the same category and size
  const validProducts = products.filter(p => p.category === category && p.size === size);

  // If no valid products, return a default label
  if (!validProducts.length) return 'No matching products';

  // Create a frequency map of words from valid product names
  const wordCount = {};
  validProducts.forEach(product => {
    const words = normalizeText(product.productname).split(" ");
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
  });

  // Determine significant words (greater occurrences)
  const significantWords = Object.keys(wordCount).filter(word => wordCount[word] > 1 || validProducts.length < 3);

  // Create a matched string based on significant words
  return significantWords.length > 0 ? capitalizeWords(significantWords.join(" ")) : validProducts[0].productname;
};

// Function to check if two products are similar based on name and size
const areProductsSimilar = (product1, product2) => {
  const normalizedName1 = normalizeText(product1.productname);
  const normalizedName2 = normalizeText(product2.productname);
  const normalizedSize1 = normalizeSize(product1.size);
  const normalizedSize2 = normalizeSize(product2.size);

  // Check if sizes and categories are the same
  const sizesMatch = normalizedSize1 === normalizedSize2;
  const categoriesMatch = product1.category === product2.category;

  // Use Levenshtein distance for name similarity
  const distance = getLevenshteinDistance(normalizedName1, normalizedName2);
  const maxLength = Math.max(normalizedName1.length, normalizedName2.length);
  const similarityThreshold = 0.4; // Adjust threshold as needed

  const namesMatch = (1 - distance / maxLength) > similarityThreshold;

  return sizesMatch && categoriesMatch && namesMatch;
};

// Normalize size values for comparison
const normalizeSize = (size) => {
  if (!size) return '';
  return size.toLowerCase().trim();
};

// Levenshtein distance algorithm for name similarity
const getLevenshteinDistance = (a, b) => {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
                     matrix[i - 1][j] + 1) // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
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
          subGroups.push({
            label: getMatchedString([product]),
            products: [product]
          });
        }
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