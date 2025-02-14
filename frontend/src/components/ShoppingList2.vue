<template>
  <div>
    <!-- New List Modal -->
    <div v-if="showNewListModal" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 space-y-4 w-full max-w-md">
        <h3 class="text-2xl font-semibold">New Shopping List</h3>
        <input 
          v-model="newListName" 
          placeholder="List Name" 
          class="w-full p-2 border border-gray-300 rounded"
        />
        <div class="flex justify-end space-x-2">
          <button 
            @click="createList" 
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create
          </button>
          <button 
            @click="showNewListModal = false" 
            class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- List Selection Modal -->
    <div v-if="showListSelectionModal" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-40" @click.stop>
      <div class="bg-white rounded-lg shadow-lg p-6 space-y-4 w-full max-w-md">
        <h3 class="text-2xl font-semibold">Select a Shopping List</h3>
        <div class="flex justify-between items-center mb-4">
          <select
            v-model="currentListId"
            class="p-2 border border-gray-300 rounded-lg"
            @change="handleListChange"
          >
            <option value="">Select a List</option>
            <option v-for="list in shoppingLists.data" :key="list.name" :value="list.name">
              {{ list.list_name }}
            </option>
          </select>
          <button
            @click="showNewListModal = true"
            class="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            New List
          </button>
        </div>
        <div class="flex justify-end">
          <button 
            @click="confirmSelection" 
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            :disabled="!currentListId"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>

    <div v-show="show && items.length" class="bg-white p-4 rounded-lg shadow-md">
      <h3 class="text-xl font-bold text-gray-900">{{ displayListName || 'Untitled List' }}</h3>
      
      <div v-if="groupedItems" class="space-y-6 mt-4">
        <div v-for="(group, source) in groupedItems" :key="source" class="border-b border-gray-200 pb-4 last:border-0">
          <div class="flex justify-between items-center mb-3 bg-gray-100 p-3 rounded-lg">
            <h4 class="text-lg font-semibold text-gray-800">{{ source }}</h4>
            <span class="text-lg font-bold text-gray-700">
              Subtotal: ${{ getGroupSubtotal(group).toFixed(2) }}
            </span>
          </div>
          
          <div class="space-y-2">
            <div v-for="item in group" 
                 :key="item.productname" 
                 class="relative flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"
                 :class="{ 'opacity-60': item.inBasket }">
              <button
                @click="removeItem(item)"
                class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors duration-200"
                title="Remove item"
              >
                <span class="text-lg leading-none">&times;</span>
              </button>

              <img 
                :src="item.image_url || 'https://placehold.co/100x100/FFFFFF/FFFFFF.png'" 
                alt="Product Image" 
                class="w-16 h-16 object-cover rounded-lg"
                @error="handleImageError"
              />

              <div class="flex-1 mb-2 sm:mb-0 ml-4">
                <strong class="text-lg block sm:inline" :class="{ 'line-through': item.inBasket }">
                  {{ item.productname }}
                </strong>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  <p class="text-sm text-gray-600">Price: ${{ item.current_price }}</p>
                  
                  <div class="flex items-center space-x-2">
                    <button 
                      @click="decreaseQuantity(item)"
                      class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 focus:outline-none"
                    >
                      <span class="text-lg">-</span>
                    </button>
                    <span class="text-sm text-gray-600 w-12 text-center">{{ item.quantity }}</span>
                    <button 
                      @click="increaseQuantity(item)"
                      class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 focus:outline-none"
                    >
                      <span class="text-lg">+</span>
                    </button>
                  </div>
                  
                  <p class="text-sm text-gray-600">Total: ${{ (item.current_price * item.quantity).toFixed(2) }}</p>
                </div>
              </div>
              <button
                @click="toggleItemInBasket(item)"
                class="w-full sm:w-auto py-2 px-4 rounded-lg transition-colors duration-200"
                :class="item.inBasket ? 
                  'bg-gray-500 hover:bg-gray-600 text-white' : 
                  'bg-green-500 hover:bg-green-600 text-white'"
              >
                {{ item.inBasket ? 'Remove from Basket' : 'Add to Basket' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-gray-200">
        <div class="text-xl font-bold text-right">
          Grand Total: ${{ totalPrice }}
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { createListResource, createResource } from 'frappe-ui';

const props = defineProps({
  show: Boolean,
  items: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['remove-item', 'export', 'update:items']);

// Modal states and input values
const showNewListModal = ref(false);
const showListSelectionModal = ref(false);
const newListName = ref('');
const currentListId = ref('');
const displayListName = ref('');
let debounceTimer = null; // Timer for debounce

// Resource for shopping lists
const shoppingLists = createListResource({
  doctype: 'Shopping List',
  fields: ['name', 'list_name'],
  orderBy: 'creation desc',
  start: 0,
  pageLength: 5,
});

// Group items by source
const groupedItems = computed(() => {
  return props.items.reduce((groups, item) => {
    const source = item.source_site;
    if (!groups[source]) {
      groups[source] = [];
    }
    groups[source].push(item);
    return groups;
  }, {});
});

// Calculate total price
const totalPrice = computed(() => {
  return props.items.reduce((total, item) => {
    return total + item.current_price * item.quantity;
  }, 0).toFixed(2);
});

// Get subtotal for a group
const getGroupSubtotal = (group) => {
  return group.reduce((total, item) => {
    return total + (item.current_price * item.quantity);
  }, 0);
};

// Debounce function
const debounce = (func, delay) => {
  return (...args) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// Save current list
const saveCurrentList = async () => {
  if (!currentListId.value) {
    return;
  }

  try {
    const formattedItems = props.items.map((item) => ({
      product: item.name,
      productname: item.productname,
      price: item.current_price,
      quantity: item.quantity,
      in_basket: item.inBasket ? 'In Basket' : 'Not in Basket',
      doctype: 'Shopping Item',
    }));

    const shoppingListResource = createResource({
      url: '/api/method/frappe.client.set_value',
      params: {
        doctype: 'Shopping List',
        name: currentListId.value,
        fieldname: 'shopping_items',
        value: formattedItems,
      },
    });

    const response = await shoppingListResource.fetch();

    if (!response || !response.name) {
      console.error('Error saving shopping list:', response);
      alert('Failed to save shopping list. Please check the console for details.');
    }
  } catch (error) {
    console.error('Error saving shopping list:', error);
    alert('Failed to save shopping list: ' + error.message);
    // Handle TimestampMismatchError specifically
    if (error.message.includes('TimestampMismatchError')) {
      alert('The shopping list has been modified by another user. Please refresh the page.');
    }
  }
};

// Debounced version of saveCurrentList
const debouncedSaveCurrentList = debounce(saveCurrentList, 1000); // Adjust the debounce time as needed

// Quantity management functions
const increaseQuantity = (item) => {
  item.quantity++;
  debouncedSaveCurrentList(); // Call the debounced save function
};

const decreaseQuantity = (item) => {
  if (item.quantity > 1) {
    item.quantity--;
    debouncedSaveCurrentList(); // Call the debounced save function
  } else {
    removeItem(item);
  }
};

// Toggle item in basket status
const toggleItemInBasket = (item) => {
  item.inBasket = item.inBasket === 'In Basket' ? 'Not in Basket' : 'In Basket'; // Toggle between states
  debouncedSaveCurrentList(); // Call the debounced save function
};

// Remove item from list
const removeItem = (item) => {
  emit('remove-item', item);
};

// Create a new shopping list
const createList = async () => {
  if (!newListName.value) {
    alert('Please enter a name for the new list.');
    return;
  }

  try {
    const existingLists = await shoppingLists.fetch({
      params: {
        doctype: 'Shopping List',
        filters: { list_name: newListName.value },
      },
    });

    if (existingLists && existingLists.length > 0) {
      alert('A shopping list with this name already exists. Please choose a different name.');
      return;
    }

    const response = await shoppingLists.insert.submit({
      list_name: newListName.value,
      items: [],
    });

    if (response && response.name) {
      currentListId.value = response.name;
      displayListName.value = newListName.value;
      showNewListModal.value = false;
      await shoppingLists.fetch();
    } else {
      console.error('Error creating shopping list, no name returned.');
      alert('Failed to create shopping list.');
    }
  } catch (error) {
    console.error('Error creating shopping list:', error);
    alert('Failed to create shopping list: ' + error.message);
  }
};

// Confirm list selection
const confirmSelection = () => {
  if (currentListId.value) {
    showListSelectionModal.value = false;
  } else {
    alert('Please select a list or create a new one.');
  }
};

// Handle list change
const handleListChange = async () => {
  if (currentListId.value) {
    try {
      const shoppingListResource = createResource({
        url: '/api/method/frappe.client.get',
        params: {
          doctype: 'Shopping List',
          name: currentListId.value,
        },
      });

      await shoppingListResource.fetch();

      if (shoppingListResource.data && shoppingListResource.data.list_name) {
        displayListName.value = shoppingListResource.data.list_name;
      }

      if (shoppingListResource.data && shoppingListResource.data.shopping_items) {
        const productDetails = await Promise.all(
          shoppingListResource.data.shopping_items.map(async (item) => {
            const productResource = createResource({
              url: '/api/method/frappe.client.get',
              params: {
                doctype: 'Product Item',
                name: item.product,
              },
            });

            try {
              await productResource.fetch();
              return productResource.data;
            } catch (error) {
              console.error(`Error fetching product details for ${item.product}:`, error);
              return null;
            }
          })
        );

        // Group items by product and sum quantities
        const itemMap = new Map();
        shoppingListResource.data.shopping_items.forEach((item, index) => {
          const productInfo = productDetails[index];
          const key = `${item.product}-${productInfo?.source_site}`;
          
          if (itemMap.has(key)) {
            const existingItem = itemMap.get(key);
            existingItem.quantity += item.quantity;
          } else {
            itemMap.set(key, {
              name: item.product,
              productname: productInfo ? productInfo.productname : item.productname,
              current_price: item.price,
              quantity: item.quantity,
              source_site: productInfo ? productInfo.source_site : item.source_site,
              image_url: productInfo ? productInfo.image_url : null,
              inBasket: item.inBasket || false,
            });
          }
        });

        const transformedItems = Array.from(itemMap.values());
        emit('update:items', transformedItems);
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  }
};

const handleImageError = (event) => {
  console.warn("Image failed to load:", event.target.src);
  event.target.src = "https://placehold.co/100x100/FFFFFF/FFFFFF.png";
};

// Watch for changes in items prop
watch(() => props.items, async (newItems) => {
  debouncedSaveCurrentList(); // Call the debounced save function
}, { deep: true });

// Fetch the shopping lists on component mount
onMounted(async () => {
  await shoppingLists.fetch();
  showListSelectionModal.value = true;
});
</script>
