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
          <div 
            v-for="(subGroup, subIndex) in group.subGroups" 
            :key="subIndex" 
            :class="[
              'space-y-3 rounded-lg',
              subGroup.products.length > 1 ? 'border-2 border-blue-200 p-4 bg-blue-50/20' : ''
            ]"
          >
            <!-- Only show subgroup header if there are multiple products -->
            <h4 v-if="subGroup.products.length > 1" class="font-semibold text-lg text-gray-700">
              {{ subGroup.label }}
              <span class="text-sm font-normal text-gray-500 ml-2">
                ({{ subGroup.products.length }} matching items)
              </span>
            </h4>
            
            <div
              v-for="(product, productIndex) in subGroup.products"
              :key="product.productname + product.source_site"
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-100"
            >
              <div class="flex-1 mb-3 sm:mb-0">
                <strong class="text-lg block sm:inline">{{ product.productname }}</strong>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  <div class="flex items-center gap-2">
                    <p class="text-sm text-gray-600">Price: ${{ product.current_price }}</p>
                    <span
                      v-if="subGroup.products.length > 1 && productIndex > 0"
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
    .replace(/\s+/g, ' ')       // Normalize spaces
    .replace(/n fruity/g, 'n fruity') // Handle specific brand cases
    .replace(/mixed berry|berry favourites/g, 'berry') // Normalize common flavor variations
    .replace(/pack|pk/g, '') // Normalize package indicators
    .trim();
};

// Normalize size values
const normalizeSize = (size) => {
  if (!size) return '';
  
  // Extract numbers and units
  const numbers = size.match(/\d+(\.\d+)?/g) || [];
  const normalized = size.toLowerCase()
    .replace(/[^0-9a-z.]/g, ' ')  // Replace special chars with space
    .replace(/(\d)([a-z])/g, '$1 $2') // Add space between number and unit
    .replace(/pottles/g, '') // Remove "pottles" word
    .trim();
  
  // Handle "X x Y" format (e.g., "6 x 125g" -> "750g")
  if (numbers.length === 2 && normalized.includes('x')) {
    const total = numbers[0] * numbers[1];
    return `${total}${normalized.split(' ').pop()}`; // Use the last unit
  }
  
  // Handle "125g pottles 750g" format - use the total weight
  if (numbers.length === 2) {
    return `${Math.max(...numbers.map(Number))}${normalized.split(' ').pop()}`;
  }
  
  return normalized
    .replace(/kgs?|kilos?/, 'kg')
    .replace(/grm?s?|grams?/, 'g')
    .replace(/mls?|millilitres?/, 'ml')
    .replace(/ltrs?|liters?/, 'l');
};

// Extract key product features for comparison
const getProductFeatures = (productName) => {
  const normalized = normalizeText(productName);
  const words = normalized.split(' ');
  
  // Extract brand name (usually first 2-3 words)
  const brand = words.slice(0, Math.min(3, words.length)).join(' ');
  
  // Extract product type and flavor
  const type = words.find(w => w.includes('yoghurt')) || '';
  const flavor = words.find(w => ['berry', 'chocolate', 'vanilla', 'strawberry'].includes(w)) || '';
  
  return { brand, type, flavor };
};

const calculateSimilarity = (str1, str2) => {
  const features1 = getProductFeatures(str1);
  const features2 = getProductFeatures(str2);
  
  let score = 0;
  
  // Compare brand names (higher weight)
  if (features1.brand === features2.brand) score += 0.5;
  
  // Compare product type
  if (features1.type === features2.type) score += 0.3;
  
  // Compare flavor
  if (features1.flavor === features2.flavor) score += 0.2;
  
  return score;
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

const areProductsSimilar = (product1, product2) => {
  // Must be in same category
  if (product1.category !== product2.category) return false;
  
  // Compare normalized sizes
  const normalizedSize1 = normalizeSize(product1.size);
  const normalizedSize2 = normalizeSize(product2.size);
  
  // Extract numbers from sizes for numerical comparison
  const size1Number = parseFloat(normalizedSize1.match(/\d+(\.\d+)?/)?.[0] || '0');
  const size2Number = parseFloat(normalizedSize2.match(/\d+(\.\d+)?/)?.[0] || '0');
  
  // Allow for small variations in size (within 5%)
  const sizesMatch = Math.abs(size1Number - size2Number) / Math.max(size1Number, size2Number) < 0.05;
  
  if (!sizesMatch) return false;
  
  // Calculate name similarity
  const similarityScore = calculateSimilarity(product1.productname, product2.productname);
  const SIMILARITY_THRESHOLD = 0.7;
  
  return similarityScore >= SIMILARITY_THRESHOLD;
};

const findGroupLabel = (products) => {
  return products
    .map(p => p.productname)
    .reduce((shortest, current) => 
      current.length < shortest.length ? current : shortest
    );
};

const sortedGroupedProducts = computed(() => {
  const groups = {};

  // Group creation remains the same
  props.paginatedProducts.forEach(product => {
    if (!product?.productname || !product.category) return;

    if (!groups[product.category]) {
      groups[product.category] = {
        category: product.category,
        subGroups: []
      };
    }

    let foundGroup = groups[product.category].subGroups.find(subGroup =>
      subGroup.products.some(p => areProductsSimilar(p, product))
    );

    if (foundGroup) {
      foundGroup.products.push({ ...product, quantity: product.quantity || 1 });
      foundGroup.label = findGroupLabel(foundGroup.products);
    } else {
      groups[product.category].subGroups.push({
        label: product.productname,
        products: [{ ...product, quantity: product.quantity || 1 }]
      });
    }
  });

  // Transform groups and add lowest price for sorting
  const groupsArray = Object.values(groups).map(group => {
    // Sort products within each subgroup by price
    const sortedSubGroups = group.subGroups
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(subGroup => ({
        ...subGroup,
        products: subGroup.products.sort((a, b) => a.current_price - b.current_price)
      }));

    // Find the lowest price across all products in this group
    const lowestPrice = Math.min(
      ...sortedSubGroups.flatMap(sg => 
        sg.products.map(p => p.current_price)
      )
    );

    return {
      ...group,
      lowestPrice,
      subGroups: sortedSubGroups
    };
  });

  // Sort groups by lowest price
  return groupsArray.sort((a, b) => a.lowestPrice - b.lowestPrice);
});

const notCategorizedProducts = computed(() => {
  return props.paginatedProducts.filter(product => !product.category);
});

const handleAddToList = (product) => {
  const quantity = product.quantity || 1;
  emit('addToList', { ...product, quantity });
};

const formatCategoryName = (category) => {
  if (!category) return '';
  return category
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};
</script>